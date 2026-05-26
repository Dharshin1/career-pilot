import crypto from 'crypto';
import UserProfile from '../models/UserProfile.model.js';

const hashKey = (key) => {
  return crypto
    .createHash('sha256')
    .update(key)
    .digest('hex');
};

export const cmsAuth = async (
  req,
  res,
  next
) => {
  try {
    const apiKey = req.header('x-api-key');

    if (!apiKey) {
      return res.status(401).json({
        success: false,
        message: 'Missing API key.',
      });
    }

    const hashedKey = hashKey(apiKey);

    const portfolio = await UserProfile.findOne({
      'cmsApiKeys.hashedKey': hashedKey,
    });

    if (!portfolio) {
      return res.status(401).json({
        success: false,
        message: 'Invalid API key.',
      });
    }

    const key = portfolio.cmsApiKeys.find((k) => {
    const stored = Buffer.from(k.hashedKey);
    const incoming = Buffer.from(hashedKey);

    if (stored.length !== incoming.length) {
        return false;
    }

    return crypto.timingSafeEqual(
        stored,
        incoming
        );
    });

    if (!key) {
      return res.status(401).json({
        success: false,
        message: 'Invalid API key.',
      });
    }

    if (key.revoked) {
      return res.status(403).json({
        success: false,
        message: 'API key revoked.',
      });
    }

    if (
      key.expiresAt &&
      new Date() > key.expiresAt
    ) {
      return res.status(403).json({
        success: false,
        message: 'API key expired.',
      });
    }

    key.lastUsed = new Date();
    key.requestCount += 1;

    await portfolio.save();

    req.portfolio = portfolio;

    next();
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message:
        'CMS authentication failed.',
    });
  }
};