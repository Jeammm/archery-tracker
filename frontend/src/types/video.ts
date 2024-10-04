/* eslint-disable @typescript-eslint/no-explicit-any */
export interface MediaVideo {
  accessControlPolicyId: string | null;
  channelName: string | null;
  createdAt: string;
  creator: {
    activatedAt: string;
    bytearkAccountUserId: number;
    createdAt: string;
    displayImage: {
      sizes: {
        default: ImageSize;
        large: ImageSize;
        medium: ImageSize;
        small: ImageSize;
      };
    };
    email: string;
    id: string;
    isBot: boolean;
    isEnabled: boolean;
    lang: string;
    name: string;
    role: string;
    updatedAt: string;
    username: string;
  };
  creatorId: string;
  customFieldEntries: any[];
  customImageEntries: any[];
  deleted: boolean;
  description: string | null;
  duration: number | null;
  embeddedUrl: string;
  geoblockPolicy: {
    appliedRule: {
      allowCountryCodes: string[];
      denyCountryCodes: string[];
    };
    id: string;
    name: string;
    ruleId: string;
    type: string;
  };
  hostingId: string;
  id: string;
  key: string;
  playable: boolean;
  playableAt: string | null;
  playbackChannelIds: string[];
  playbackChannels: PlaybackChannel[];
  playbackUrls: PlaybackUrl[];
  playerId: string;
  primaryPlaybackChannel: PlaybackChannel;
  primaryPlaybackChannelId: string;
  primaryPlaybackUrl: PlaybackUrl;
  project: Project;
  projectId: string;
  subtitle: string | null;
  tagIds: string[];
  tags: any[];
  title: string;
  updatedAt: string;
  vod: Vod;
  vodId: string;
}

interface ImageSize {
  height: number;
  url: string;
  width: number;
}

interface PlaybackChannel {
  accessControlPolicy: {
    allowDomains: string[];
    denyDomains: string[];
    exclusiveAllowIps: string[];
  };
  allowPreview: boolean;
  createdAt: string;
  defaultPlaybackDomain: string;
  defaultPlaybackMaxResolution: {
    enabled: boolean;
    maxResolution: string;
  };
  deleted: boolean;
  features: {
    bumpers: {
      enabled: boolean;
    };
  };
  id: string;
  name: string;
  playbackDomains: string[];
  signedUrl: {
    required: boolean;
    urlSigningKeyIds: string[];
  };
  teamNamespace: string;
  updatedAt: string;
  viewerGroups: {
    enabled: boolean;
    groups: any[];
  };
}

interface PlaybackUrl {
  hls: {
    name: string;
    url: string;
  }[];
  name: string;
}

interface Project {
  createdAt: string;
  creatorId: string;
  currentJobQueueKey: string;
  deleted: boolean;
  description: string | null;
  downloadVideoOutputSetting: {
    scheduleExpire: {
      days: number;
      enabled: boolean;
    };
  };
  geoblockRuleId: string;
  hostingId: string;
  id: string;
  key: string;
  livePresetId: string;
  memberships: Membership[];
  name: string;
  playbackChannelIds: string[];
  playerId: string;
  presetId: string;
  primaryPlaybackChannelId: string;
  storageTierKey: string;
  teamNamespace: string;
  updatedAt: string;
  videoCount: number;
}

interface Membership {
  accountId: string;
  addedAt: string;
  addedById: string;
  previousProjectRole: string;
  projectRole: string;
}

interface Vod {
  autoGenerateCaptionSetting: string | null;
  captions: any[];
  createdAt: string;
  id: string;
  outputs: any[];
  playable: boolean;
  playableAt: string | null;
  playbackFormats: string[];
  presetId: string;
  processingInfo: {
    state: string;
    totalCompletedOutputs: number | null;
    totalExpectedOutputs: number | null;
  };
  revisionKey: string;
  source: Source;
  sourceAvailabledAt: string | null;
  sourceId: string;
  startPts: number;
  storageId: string;
  storyboards: any[];
  submittedAt: string | null;
  updatedAt: string;
  uploadable: boolean;
  videoId: string;
}

interface Source {
  audioCodec: string | null;
  avgFrameRate: string | null;
  displayAspectRatio: string | null;
  duration: number | null;
  fileDeletedAt: string | null;
  fileName: string | null;
  frameRate: string | null;
  height: number | null;
  id: string;
  path: string | null;
  probeCompletedAt: string | null;
  probeErrorDetail: string | null;
  probeErrorRetryCount: number;
  probeErrorType: string | null;
  probeStartedAt: string | null;
  rFrameRate: string | null;
  size: number | null;
  snapshotCompletedAt: string | null;
  snapshotErrorDetail: string | null;
  snapshotErrorRetryCount: number;
  snapshotErrorType: string | null;
  snapshotStartedAt: string | null;
  submittedAt: string | null;
  type: string | null;
  videoCodec: string | null;
  width: number | null;
}
