## Application scenarios of different FR scripts
### `face_recog_demo`: 
**Functionality:**
- Real-time facial recognition designed for high-performance environments.

**Features:**  
- Processes live video streams continuously.
- Requires significant compute resources (GPU or cloud-based processing).

**Suitable Scenarios:**  
- Environments with abundant computing power (e.g. enterprise surveillance, security systems in controlled facilities) where low-latency and uninterrupted recognition are critical.

### `face_recog_us187`: 
**Functionality:**
- Asynchronous FR using captured still images triggered by an event.

**Features:** 
- Only captures images when a trigger (e.g., an NFC event) occurs.
- Runs recognition on the captured still image rather than on a continuous video feed.

**Suitable Scenarios:** 
- Resource-constrained or edge devices where continuous processing is not practical (e.g. attendance monitoring, access control systems that rely on infrequent triggers).

### `face_recog_ts250`: 
**Functionality:**
- Asynchronous FR enhanced with video clipping functionality based on a still-image trigger.

**Features:** 
- Inherits the asynchronous still-image approach of us187.
- Adds the capability to record a short video clip along with the image capture.

**Suitable Scenarios:** 
- Scenarios where additional evidence is beneficial—for example, outdoor access control in variable lighting or motion conditions, or any application where the still image might be suboptimal and multi-frame analysis can boost recognition accuracy.
### `face_recog_us255`: 
**Functionality:**
- Asynchronous FR combining both captured still images and corresponding clipped video data.
**Features:** 
- Processes both the still image and the short video clip triggered by an event.
- Cross-validates recognition results between the image and video analysis.

**Suitable Scenarios:** 
- High-security or mission-critical applications where redundancy is needed and conditions may be challenging (e.g. dynamic environments or noisy backdrops), ensuring robust and reliable recognition even if one source is less clear.
## Folder Purposes Across the Files:
- `RawPic`: Stores raw still captured images from the camera. Images in this folder will be delated automatically after FR on pictures. 
- `captured_photo`: Holds cropped face images extracted from captured images after FR on pictures.
- `FRedPic`: Contains full-frame annotated images (with bounding boxes and labels) generated after FR on pictures.
- `ClipVideo`: Used for storing raw video clips that are recorded when a trigger event occurs. Files in this folder will be delated automatically after FR on videos.
- `ClipVideo_V`: Holds video clips that have been overlaid with continuous FR annotations, generated after FR on videos.
- `FRedPic_V`: Saves full-frame annotated images extracted from video frames after FR on videos.
- `captured_photo_V`: Stores cropped face images generated from video FR, with overlays. Generated after FR on videos. 
- `face_log.txt`: Central log file where recognized identities, similarity scores, and timestamps are recorded; further appends a `VV` (`video varified`) or `VF`('varified failed') suffix for video recognition outcomes.