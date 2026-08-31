export interface PresignProfileParams {
  userId: number;
  fileName: string;
  contentType: string;
  expiresInSeconds?: number;
}

export interface PresignBannerParams {
  trainerId: number;
  fileName: string;
  contentType: string;
  expiresInSeconds?: number;
}

export interface PresignVideoParams {
  trainerId: number;
  exerciseId: number;
  fileName: string;
  contentType: string;
  expiresInSeconds?: number;
}

export interface PresignResponse {
  uploadUrl: string;
  key: string;
}

export interface DownloadParams {
  key: string;
  expiresInSeconds?: number;
}

export interface UpdateProfilePicturesPayload {
  userId: number;
  profilePicture?: string | null;
  bannerPicture?: string | null;
}
