import React, {
  RefObject,
  memo,
  useCallback,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Alert,
  GestureResponderEvent,
  PanResponder,
  PixelRatio,
  Pressable,
  StyleSheet,
  Vibration,
  View,
} from 'react-native';
import ViewShot from 'react-native-view-shot';
import FastImage from 'react-native-fast-image';
import {API_KEY, AppScreens, Colors} from '../constants';
import {ScreenProps} from '../routes/types';
import WebView from 'react-native-webview';

const VISION_API = `https://vision.googleapis.com/v1/images:annotate?key=${API_KEY}`;

const densityScale = PixelRatio.get();
///////////
// types //
///////////

type positions = {
  height: number;
  width: number;
  top: number;
  left: number;
  rotate: number;
  text: string;
};

type selectableProps = {
  Positions: positions[];
};

interface VisionApiResponse {
  description: string;
  boundingPoly: BoundingPoly;
}

interface BoundingPoly {
  vertices: Vertex[];
}

interface Vertex {
  x: number;
  y: number;
}

type selectedText = {
  index: number;
  text: string;
};

type SelectableRefsType = Array<RefObject<View>>;

type rangeType = {
  min: number | null;
  max: number | null;
};

//////////
///code///
//////////

const GoogleLensNew = ({route}: ScreenProps<'GoogleLens'>) => {
  const image = route.params.image;
  const [Positions, setPositions] = useState<positions[]>([]);
  const ViewRef = useRef<any>(null);

  const fetchImageDetails = async () => {
    if (!API_KEY) {
      Alert.alert(
        'API Key not found',
        'Please add your google API key in constants in order to use the google lens feature.',
      );
      return;
    }

    try {
      const Base64 = await ViewRef.current?.capture();
      const body = {
        requests: [
          {
            image: {
              content: Base64,
            },
            features: [
              {
                type: 'TEXT_DETECTION',
                maxResults: 1,
              },
            ],
          },
        ],
      };
      const response = await fetch(VISION_API, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        const result = await response.json();
        const filtered: VisionApiResponse =
          result.responses[0].textAnnotations?.slice(1);

        if (Array.isArray(filtered) && filtered.length > 0) {
          const formattedData = filtered.map((element: VisionApiResponse) => {
            const vertices = element.boundingPoly.vertices;

            const xValues = vertices
              .map((vertex: Vertex) => vertex.x)
              .sort((a: number, b: number) => a - b);
            const yValues = vertices
              .map((vertex: Vertex) => vertex.y)
              .sort((a: number, b: number) => a - b);

            const minX = (xValues[0] + xValues[1]) / 2;
            const maxX = (xValues[2] + xValues[3]) / 2;
            const minY = (yValues[0] + yValues[1]) / 2;
            const maxY = (yValues[2] + yValues[3]) / 2;

            // Calculate top and left coordinates
            const left = Math.round(minX / densityScale);
            const top = Math.round(minY / densityScale);

            // Calculate width and height
            const width = Math.abs((maxX - minX) / densityScale);
            const height = Math.abs((maxY - minY) / densityScale);

            // Calculate rotation angle (assuming a rectangle)
            const angleRadians = Math.atan2(
              vertices[1].y - vertices[0].y,
              vertices[1].x - vertices[0].x,
            );
            const rotation = Math.round((angleRadians * 180) / Math.PI);

            // Extract text
            const text = element.description;

            return {
              width: width ? width : 0,
              height: height ? height : 0,
              top: top ? top : 0,
              left: left ? left : 0,
              text,
              rotate: height > width ? 0 : rotation,
            };
          });

          setPositions(formattedData);
        }
      } else {
      }
    } catch (error) {
    } finally {
    }
  };

  const htmlPage = useMemo(() => {
    const positionsHtml = Positions.map(
      (item, index) => `
        <div style="
            position: absolute;
            height: ${item?.height}px;
            width: ${item?.width}px;
            top: ${item?.top}px;
            left: ${item?.left}px;
            transform: rotate(${item.rotate}deg);" 
            key=${index}>
            ${item.text}
        </div>`,
    ).join('');

    return `
      <html>
      <head>
      <title>Jen Lens</title>
      <meta name="viewport" content="initial-scale=1.0, maximum-scale=1.0">
      <style>
        body, html { margin: 0; padding: 0; overflow: hidden; background:transparent; position: relative; }
        img { min-width: 100%; min-height: 100%; object-fit: contain; }
        div { position: absolute; font-size: 10px; color: transparent; background: #ffffff47; selection-color: #00000000; }
      </style>
      </head>
      <body>
        ${positionsHtml}
      </body>
      </html>
    `;
  }, [image, Positions]);

  return (
    <View style={[styles.GoogleLens]}>
      <ViewShot
        style={styles.GoogleLens}
        ref={ViewRef}
        options={{result: 'base64', quality: 1}}>
        <FastImage
          source={{uri: image, priority: FastImage.priority.high}}
          resizeMode="contain"
          style={styles.GoogleLens}
          onLoadEnd={() => {
            setTimeout(() => {
              fetchImageDetails();
            }, 200);
          }}
        />
      </ViewShot>
      <View style={styles.webView}>
        <WebView
          source={{html: htmlPage}}
          style={styles.webView}
          scrollEnabled={false}
          overScrollMode="never"
          bounces={false}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  GoogleLens: {flex: 1, backgroundColor: Colors.dark},
  webView: {
    flex: 1,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
  },
});

export default memo(GoogleLensNew);
