const catchAsync = require("./../utils/catchAsync");
const AppError = require("./../utils/appError");
const APIFeatures = require("./../utils/apiFeatures");
const {
  getRedis,
  isRedisReady,
  safeRedisOperation
} = require("./../providers/RedisProvider");

// Cache configuration
const CACHE_CONFIG = {
  TTL: {
    SHORT: 300,
    MEDIUM: 1800,
    LONG: 3600
  },
  KEYS: {
    SINGLE_DOC: (model, id) => `${model}:single:${id}`,
    ALL_DOCS: (model, queryHash) => `${model}:all:${queryHash}`,
    COUNT: (model, queryHash) => `${model}:count:${queryHash}`
  }
};

const generateCacheKey = (baseKey, query) => {
  const queryString = JSON.stringify(query);
  const crypto = require("crypto");
  const hash = crypto
    .createHash("md5")
    .update(queryString)
    .digest("hex");
  return `${baseKey}:${hash}`;
};

const invalidateCache = async (model, id = null) => {
  await safeRedisOperation(async () => {
    const redisClient = getRedis().instanceConnect;
    const pattern = `${model}:*`;

    // Get all keys matching pattern
    const keys = await redisClient.keys(pattern);

    if (keys.length > 0) {
      await redisClient.del(keys);
      console.log(
        `🗑️ Invalidated ${keys.length} cache keys for model: ${model}`
      );
    }
  });
};

exports.deleteOne = Model =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndDelete(req.params.id);

    if (!doc) {
      return next(new AppError("No document found with that ID", 404));
    }

    // Invalidate cache after successful deletion
    await invalidateCache(Model.modelName, req.params.id);

    res.status(204).json({
      status: "success",
      data: null
    });
  });

exports.updateOne = Model =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    if (!doc) {
      return next(new AppError("No document found with that ID", 404));
    }

    // Invalidate cache after successful update
    await invalidateCache(Model.modelName, req.params.id);

    res.status(200).json({
      status: "success",
      data: {
        data: doc
      }
    });
  });

exports.createOne = Model =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.create(req.body);

    // Invalidate cache after successful creation
    await invalidateCache(Model.modelName);

    res.status(201).json({
      status: "success",
      data: {
        data: doc
      }
    });
  });

exports.getOne = (Model, popOptions, cacheTTL = CACHE_CONFIG.TTL.MEDIUM) =>
  catchAsync(async (req, res, next) => {
    // Check if Redis is ready
    if (!isRedisReady()) {
      console.warn("⚠️ Redis not available, fetching from database");
      let query = Model.findById(req.params.id);
      if (popOptions) query = query.populate(popOptions);
      const doc = await query;

      if (!doc) {
        return next(new AppError("No document found with that ID", 404));
      }

      return res.status(200).json({
        status: "success",
        cached: false,
        data: {
          data: doc
        }
      });
    }

    const cacheKey = CACHE_CONFIG.KEYS.SINGLE_DOC(
      Model.modelName,
      req.params.id
    );

    // Try to get from cache
    const cachedDoc = await safeRedisOperation(async () => {
      const redisClient = getRedis().instanceConnect;
      return await redisClient.get(cacheKey);
    });

    if (cachedDoc) {
      console.log(`📦 Cache HIT for ${cacheKey}`);
      return res.status(200).json({
        status: "success",
        cached: true,
        data: {
          data: JSON.parse(cachedDoc)
        }
      });
    }

    console.log(`🔍 Cache MISS for ${cacheKey}`);

    // Fetch from database
    let query = Model.findById(req.params.id);
    if (popOptions) query = query.populate(popOptions);
    const doc = await query;

    if (!doc) {
      return next(new AppError("No document found with that ID", 404));
    }

    // Store in cache
    await safeRedisOperation(async () => {
      const redisClient = getRedis().instanceConnect;
      await redisClient.setEx(cacheKey, cacheTTL, JSON.stringify(doc));
      console.log(`💾 Cached document with key: ${cacheKey}`);
    });

    res.status(200).json({
      status: "success",
      cached: false,
      data: {
        data: doc
      }
    });
  });

exports.getAll = (Model, cacheTTL = CACHE_CONFIG.TTL.SHORT) => async (
  req,
  res,
  next
) => {
  try {
    const redisClient = getRedis().instanceConnect;

    // Generate cache keys based on query
    const queryForCache = { ...req.query };
    const dataCacheKey = generateCacheKey(
      CACHE_CONFIG.KEYS.ALL_DOCS(Model.modelName, ""),
      queryForCache
    );
    const countCacheKey = generateCacheKey(
      CACHE_CONFIG.KEYS.COUNT(Model.modelName, ""),
      queryForCache
    );

    // Try to get both data and count from cache
    const [cachedData, cachedCount] = await Promise.all([
      redisClient.get(dataCacheKey),
      redisClient.get(countCacheKey)
    ]);

    if (cachedData && cachedCount) {
      console.log(`📦 Cache HIT for getAll ${Model.modelName}`);
      const data = JSON.parse(cachedData);
      const totalDocuments = parseInt(cachedCount);

      // Calculate pagination info
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const totalPages = Math.ceil(totalDocuments / limit);

      return res.status(200).json({
        status: "success",
        cached: true,
        results: data.length,
        pagination: {
          page: page,
          limit: limit,
          totalDocuments: totalDocuments,
          totalPages: totalPages,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
          nextPage: page < totalPages ? page + 1 : null,
          prevPage: page > 1 ? page - 1 : null
        },
        data: {
          data: data
        }
      });
    }

    console.log(`🔍 Cache MISS for getAll ${Model.modelName}`);

    // If not in cache, fetch from database
    const countQuery = Model.find();

    const queryObj = { ...req.query };
    const excludedFields = ["page", "sort", "limit", "fields"];
    excludedFields.forEach(el => delete queryObj[el]);

    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`);

    const totalDocuments = await countQuery
      .find(JSON.parse(queryStr))
      .countDocuments();

    const features = new APIFeatures(Model.find(), req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate();

    const doc = await features.query;
    const { page, limit } = features.getPaginationInfo();
    const totalPages = Math.ceil(totalDocuments / limit);

    // Cache both data and count
    await Promise.all([
      redisClient.setEx(dataCacheKey, cacheTTL, JSON.stringify(doc)),
      redisClient.setEx(countCacheKey, cacheTTL, totalDocuments.toString())
    ]);

    console.log(`💾 Cached getAll data for ${Model.modelName}`);

    res.status(200).json({
      status: "success",
      cached: false,
      results: doc.length,
      pagination: {
        page: page,
        limit: limit,
        totalDocuments: totalDocuments,
        totalPages: totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
        nextPage: page < totalPages ? page + 1 : null,
        prevPage: page > 1 ? page - 1 : null
      },
      data: {
        data: doc
      }
    });
  } catch (error) {
    console.error("⚠️ Error in getAll with cache:", error);

    // Fallback to original implementation
    try {
      const countQuery = Model.find();

      const queryObj = { ...req.query };
      const excludedFields = ["page", "sort", "limit", "fields"];
      excludedFields.forEach(el => delete queryObj[el]);

      let queryStr = JSON.stringify(queryObj);
      queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`);

      const totalDocuments = await countQuery
        .find(JSON.parse(queryStr))
        .countDocuments();

      const features = new APIFeatures(Model.find(), req.query)
        .filter()
        .sort()
        .limitFields()
        .paginate();

      const doc = await features.query;
      const { page, limit } = features.getPaginationInfo();
      const totalPages = Math.ceil(totalDocuments / limit);

      res.status(200).json({
        status: "success",
        cached: false,
        results: doc.length,
        pagination: {
          page: page,
          limit: limit,
          totalDocuments: totalDocuments,
          totalPages: totalPages,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
          nextPage: page < totalPages ? page + 1 : null,
          prevPage: page > 1 ? page - 1 : null
        },
        data: {
          data: doc
        }
      });
    } catch (fallbackError) {
      res.status(400).json({
        status: "fail",
        message: fallbackError.message
      });
    }
  }
};

// Additional utility functions for cache management
exports.clearModelCache = Model =>
  catchAsync(async (req, res, next) => {
    await invalidateCache(Model.modelName);

    res.status(200).json({
      status: "success",
      message: `Cache cleared for model: ${Model.modelName}`
    });
  });

exports.getCacheStats = () =>
  catchAsync(async (req, res, next) => {
    try {
      const redisClient = getRedis().instanceConnect;
      const info = await redisClient.info("memory");
      const dbSize = await redisClient.dbSize();

      res.status(200).json({
        status: "success",
        data: {
          totalKeys: dbSize,
          memoryInfo: info
        }
      });
    } catch (error) {
      res.status(500).json({
        status: "error",
        message: "Unable to get cache statistics"
      });
    }
  });
