import React, {useCallback, useEffect, useState} from 'react';
import {View, StyleSheet, Linking} from 'react-native';
import {
  Camera,
  useCameraDevices,
  useFrameProcessor,
} from 'react-native-vision-camera';
import {labelImage} from 'vision-camera-image-labeler';
import {useSharedValue} from 'react-native-reanimated';
import {Label} from './src/Label';

const App = () => {
  const currentLabel = useSharedValue('');

  const [isLoading, setIsLoading] = useState<boolean>(true);

  const [isAllowed, setIsAllowed] = useState<boolean>(false);

  const requestCameraPermission = useCallback(async () => {
    const requestCameraAccess = await Camera.requestCameraPermission();
    if (requestCameraAccess === 'authorized') {
      setIsAllowed(true);
    } else {
      setIsAllowed(false);
    }
    setIsLoading(false);
  }, []);

  const checkIfPermitted = useCallback(async () => {
    const cameraHasAccess = await Camera.getCameraPermissionStatus();
    if (cameraHasAccess === 'authorized') {
      setIsAllowed(true);
      setIsLoading(false);
    } else if (cameraHasAccess === 'not-determined') {
      await requestCameraPermission();
    } else if (
      cameraHasAccess === 'restricted' ||
      cameraHasAccess === 'denied'
    ) {
      await Linking.openSettings();
      setIsAllowed(false);
      setIsLoading(false);
    }
  }, [requestCameraPermission]);

  const device = useCameraDevices().back;

  const imageLabeler = useFrameProcessor(frame => {
    'worklet';
    const labels = labelImage(frame);
    currentLabel.value = labels[0]?.label;
  }, []);

  useEffect(() => {
    checkIfPermitted().then();
  }, [checkIfPermitted]);

  return (
    <View style={styles.container}>
      {!isLoading && isAllowed && device !== undefined && (
        <>
          <Camera
            device={device}
            isActive={true}
            style={styles.camera}
            frameProcessor={imageLabeler}
            frameProcessorFps={16}
          />
          <Label sharedValue={currentLabel} />
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'black',
  },
  camera: {
    flex: 1,
    width: '100%',
  },
});
export default App;
