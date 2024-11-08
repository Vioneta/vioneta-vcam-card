import { afterEach, describe, expect, it } from 'vitest';
import { RecordingSegmentsCache, RequestCache } from '../../../src/camera-manager/cache';
import { FrigateCameraManagerEngine } from '../../../src/camera-manager/frigate/engine-frigate';
import {
  FrigateEventViewMedia,
  FrigateRecordingViewMedia,
} from '../../../src/camera-manager/frigate/media';
import { FrigateEvent, eventSchema } from '../../../src/camera-manager/frigate/types.js';
import { CameraConfig, RawFrigateCardConfig } from '../../../src/types';
import { ViewMedia } from '../../../src/view/media';
import { createCameraConfig, createHASS } from '../../test-utils';

const createEngine = (): FrigateCameraManagerEngine => {
  return new FrigateCameraManagerEngine(
    {},
    new RecordingSegmentsCache(),
    new RequestCache(),
  );
};

const createRecordingMedia = (): FrigateRecordingViewMedia => {
  return new FrigateRecordingViewMedia(
    'recording',
    'camera-1',
    {
      cameraID: 'camera-1',
      startTime: new Date('2023-06-16T20:00:00Z'),
      endTime: new Date('2023-06-16T20:59:59Z'),
      events: 1,
    },
    'recording-id',
    'recording-content-id',
    'recording-title',
  );
};

const createEvent = (): FrigateEvent => {
  return eventSchema.parse({
    camera: 'camera-1',
    end_time: 1686974399,
    false_positive: false,
    has_clip: true,
    has_snapshot: true,
    id: 'event-id',
    label: 'person',
    sub_label: null,
    start_time: 1686970800,
    top_score: 0.8,
    zones: [],
    retain_indefinitely: true,
  });
};

const createClipMedia = (): FrigateEventViewMedia => {
  return new FrigateEventViewMedia(
    'clip',
    'camera-1',
    createEvent(),
    'event-clip-content-id',
    'event-clip-thumbnail',
  );
};

const createSnapshotMedia = (): FrigateEventViewMedia => {
  return new FrigateEventViewMedia(
    'snapshot',
    'camera-1',
    createEvent(),
    'event-snapshot-content-id',
    'event-snapshot-thumbnail',
  );
};

const createFrigateCameraConfig = (config?: RawFrigateCardConfig): CameraConfig => {
  return createCameraConfig({
    frigate: {
      camera_name: 'camera-1',
    },
    ...config,
  });
};

describe('getMediaDownloadPath', () => {
  afterEach(() => {});

  it('should get event with clip download path', async () => {
    const endpoint = await createEngine().getMediaDownloadPath(
      createHASS(),
      createFrigateCameraConfig(),
      createClipMedia(),
    );

    expect(endpoint).toEqual({
      endpoint: '/api/frigate/frigate/notifications/event-id/clip.mp4?download=true',
      sign: true,
    });
  });

  it('should get event with snapshot download path', async () => {
    const endpoint = await createEngine().getMediaDownloadPath(
      createHASS(),
      createFrigateCameraConfig(),
      createSnapshotMedia(),
    );

    expect(endpoint).toEqual({
      endpoint: '/api/frigate/frigate/notifications/event-id/snapshot.jpg?download=true',
      sign: true,
    });
  });

  it('should get recording download path', async () => {
    const endpoint = await createEngine().getMediaDownloadPath(
      createHASS(),
      createFrigateCameraConfig(),
      createRecordingMedia(),
    );

    expect(endpoint).toEqual({
      endpoint:
        '/api/frigate/frigate/recording/camera-1/start/1686945600/end/1686949199?download=true',
      sign: true,
    });
  });

  it('should get no path for unknown type', async () => {
    const endpoint = await createEngine().getMediaDownloadPath(
      createHASS(),
      createFrigateCameraConfig(),
      new ViewMedia('clip', 'camera-1'),
    );
    expect(endpoint).toBeNull();
  });
});
