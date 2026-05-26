import express from 'express';
import crypto from 'crypto';

import UserProfile from '../models/UserProfile.model.js';
import { verifyToken } from '../middleware/auth.js';
import { asyncHandler, ApiError } from '../middleware/errorHandler.js';

const router = express.Router();

const MAX_KEYS = 3;
const GRACE_PERIOD_DAYS = 7;

const generateApiKey = () => {
  return crypto.randomBytes(32).toString('hex');
};

const hashKey = (key) => {
  return crypto
    .createHash('sha256')
    .update(key)
    .digest('hex');
};

/**
 * GET all CMS API keys
 */
router.get(
  '/:portfolioId/keys',
  verifyToken,
  asyncHandler(async (req, res) => {
    const { portfolioId } = req.params;

    if (req.user.uid !== portfolioId) {
      throw new ApiError(
        403,
        'Unauthorized access to this portfolio.'
      );
    }

    const portfolio = await UserProfile.findOne({
      uid: portfolioId,
    });

    if (!portfolio) {
      throw new ApiError(404, 'Portfolio not found.');
    }

    res.status(200).json({
      success: true,
      data: (portfolio.cmsApiKeys || []).map((key) => ({
        id: key._id,
        name: key.name,
        prefix: key.prefix,
        createdAt: key.createdAt,
        expiresAt: key.expiresAt,
        revoked: key.revoked,
        lastUsed: key.lastUsed,
        requestCount: key.requestCount,
      })),
    });
  })
);

/**
 * CREATE new API key
 */
router.post(
  '/:portfolioId/keys',
  verifyToken,
  asyncHandler(async (req, res) => {
    const { portfolioId } = req.params;
    const { name } = req.body;

    if (req.user.uid !== portfolioId) {
      throw new ApiError(
        403,
        'Unauthorized access to this portfolio.'
      );
    }

    if (!name) {
      throw new ApiError(
        400,
        'Key name is required.'
      );
    }

    const portfolio = await UserProfile.findOne({
      uid: portfolioId,
    });

    if (!portfolio) {
      throw new ApiError(404, 'Portfolio not found.');
    }

    const activeKeys = (portfolio.cmsApiKeys || []).filter(
        (key) =>
            !key.revoked &&
            (!key.expiresAt ||
                new Date(key.expiresAt) > new Date())
    );

    if (activeKeys.length >= MAX_KEYS) {
      throw new ApiError(
        400,
        'Maximum of 3 active API keys allowed.'
      );
    }

    const rawKey = generateApiKey();

    portfolio.cmsApiKeys.push({
        name,
        hashedKey: hashKey(rawKey),
        prefix: rawKey.slice(0, 8),
        createdAt: new Date(),
    });

    await portfolio.save();

    res.status(201).json({
      success: true,
      message:
        'API key created. Store it securely.',
      data: {
        apiKey: rawKey,
      },
    });
  })
);

/**
 * ROTATE API key
 */
router.post(
  '/:portfolioId/keys/:keyId/rotate',
  verifyToken,
  asyncHandler(async (req, res) => {
    const { portfolioId, keyId } = req.params;

    if (req.user.uid !== portfolioId) {
      throw new ApiError(
        403,
        'Unauthorized access to this portfolio.'
      );
    }

    const portfolio = await UserProfile.findOne({
      uid: portfolioId,
    });

    if (!portfolio) {
      throw new ApiError(404, 'Portfolio not found.');
    }

    const existingKey =
      portfolio.cmsApiKeys.id(keyId);

    if (!existingKey) {
      throw new ApiError(
        404,
        'API key not found.'
      );
    }

    existingKey.expiresAt = new Date(
      Date.now() +
        GRACE_PERIOD_DAYS *
          24 *
          60 *
          60 *
          1000
    );

    const rawKey = generateApiKey();

    portfolio.cmsApiKeys.push({
      name: `${existingKey.name} (Rotated)`,
      hashedKey: hashKey(rawKey),
      prefix: rawKey.slice(0, 8),
      createdAt: new Date(),
    });

    await portfolio.save();

    res.status(200).json({
      success: true,
      message:
        'API key rotated successfully.',
      data: {
        apiKey: rawKey,
      },
    });
  })
);

/**
 * REVOKE API key
 */
router.delete(
  '/:portfolioId/keys/:keyId',
  verifyToken,
  asyncHandler(async (req, res) => {
    const { portfolioId, keyId } = req.params;

    if (req.user.uid !== portfolioId) {
      throw new ApiError(
        403,
        'Unauthorized access to this portfolio.'
      );
    }

    const portfolio = await UserProfile.findOne({
      uid: portfolioId,
    });

    if (!portfolio) {
      throw new ApiError(404, 'Portfolio not found.');
    }

    const existingKey =
      portfolio.cmsApiKeys.id(keyId);

    if (!existingKey) {
      throw new ApiError(
        404,
        'API key not found.'
      );
    }

    existingKey.revoked = true;

    await portfolio.save();

    res.status(200).json({
      success: true,
      message: 'API key revoked.',
    });
  })
);

export default router;
