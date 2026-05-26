import mongoose from 'mongoose';

const userProfileSchema = new mongoose.Schema({
  uid: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  displayName: {
    type: String,
    default: '',
    maxlength: 100,
    trim: true,
  },
  bio: {
    type: String,
    default: '',
    maxlength: 500,
    trim: true,
  },
  jobRole: {
    type: String,
    default: '',
    maxlength: 100,
    trim: true,
  },
  skills: [{
    type: String,
    trim: true,
    maxlength: 50,
  }],
  location: {
    type: String,
    default: '',
    maxlength: 100,
    trim: true,
  },
  website: {
    type: String,
    default: '',
    maxlength: 200,
    trim: true,
  },
  github: {
    type: String,
    default: '',
    maxlength: 100,
    trim: true,
  },
  linkedin: {
    type: String,
    default: '',
    maxlength: 200,
    trim: true,
  },
  projects: [{
    githubRepoUrl: {
      type: String,
      trim: true,
    },
    isManuallyEdited: {
      type: Boolean,
      default: false,
    },
    lastSyncedAt: {
      type: Date,
    },
    autoData: {
      description: {
        type: String,
        default: '',
      },
      readme: {
        type: String,
        default: '',
      }
    }
  }],
  cmsApiKeys: {
    type: [
      {
        name: {
          type: String,
          required: true,
          trim: true,
          maxlength: 50,
        },

        hashedKey: {
          type: String,
          required: true,
        },

        prefix: {
          type: String,
          required: true,
        },

        createdAt: {
          type: Date,
          default: Date.now,
        },

        expiresAt: {
          type: Date,
          default: null,
        },

        revoked: {
          type: Boolean,
          default: false,
        },

        lastUsed: {
          type: Date,
          default: null,
        },

        requestCount: {
          type: Number,
          default: 0,
        },
      },
    ],
    default: [],
},
}, { timestamps: true });

<<<<<<< HEAD
=======
userProfileSchema.index({ uid: 1, updatedAt: -1 }, { background: true });
userProfileSchema.index({ jobRole: 1 }, { background: true });
userProfileSchema.index({ location: 1 }, { background: true });
userProfileSchema.index({ skills: 1 }, { background: true });

userProfileSchema.index(
  { 'cmsApiKeys.hashedKey': 1 },
  { background: true }
);

>>>>>>> 325c73f (Add secure CMS API key management and authentication)
export default mongoose.model('UserProfile', userProfileSchema);
