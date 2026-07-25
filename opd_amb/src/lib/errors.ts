export class EMSError extends Error {
  constructor(
    message: string,
    public code: string = 'EMS_ERROR',
    public statusCode: number = 500
  ) {
    super(message)
    this.name = 'EMSError'
  }
}

export class OfflineSyncError extends EMSError {
  constructor(message: string = 'Network unavailable, action queued for sync') {
    super(message, 'OFFLINE_QUEUED', 503)
    this.name = 'OfflineSyncError'
  }
}

export class MissionAccessDeniedError extends EMSError {
  constructor(message: string = 'You are not authorized for this mission step') {
    super(message, 'MISSION_ACCESS_DENIED', 403)
    this.name = 'MissionAccessDeniedError'
  }
}
