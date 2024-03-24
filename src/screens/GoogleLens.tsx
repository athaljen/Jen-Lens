import React, {RefObject, memo, useCallback, useRef, useState} from 'react';
import {
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

const densityScale = PixelRatio.get();

const VISION_API = `https://vision.googleapis.com/v1/images:annotate?key=${API_KEY}`;

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

const SelectableView = (props: selectableProps) => {
  const {Positions} = props;
  const selectableRefs = useRef<SelectableRefsType>([]);
  const [selectedText, setSelectedText] = useState<selectedText | any>({});
  const [Range, setRange] = useState<rangeType>({min: null, max: null});

  const resetSelection = useCallback(() => {
    setSelectedText({});
    setRange({min: null, max: null});
  }, []);

  const checkIfInside = (
    viewRef: any,
    CurrentIndex: number,
    touchX: number,
    touchY: number,
  ) => {
    viewRef.current?.measure(
      (
        x: number,
        y: number,
        width: number,
        height: number,
        pageX: number,
        pageY: number,
      ) => {
        if (
          touchX >= pageX &&
          touchX <= pageX + width &&
          touchY >= pageY &&
          touchY <= pageY + height
        ) {
          if (Range.min == null || Range.max == null) {
            setRange({max: CurrentIndex, min: CurrentIndex});
          } else if (CurrentIndex > Range.min && CurrentIndex < Range.max) {
            setRange(prev =>
              Math.abs(prev.min || 0 - CurrentIndex) <
              Math.abs(prev.max || 0 - CurrentIndex)
                ? {...prev, min: CurrentIndex}
                : {...prev, max: CurrentIndex},
            );
          } else if (CurrentIndex < Range.min) {
            setRange(prev => ({...prev, min: CurrentIndex}));
          } else if (CurrentIndex > Range.max) {
            setRange(prev => ({...prev, max: CurrentIndex}));
          }
        }
      },
    );
  };

  const handleMove = useCallback(
    (e: GestureResponderEvent) => {
      const touchX = e.nativeEvent.pageX;
      const touchY = e.nativeEvent.pageY;

      setSelectedText({});

      selectableRefs.current?.forEach((item: any, index: any) => {
        checkIfInside(item, index, touchX, touchY);
      });
    },
    [checkIfInside],
  );

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderMove: handleMove,
    // onPanResponderGrant: resetSelection,
  });

  const selectOneHandler = useCallback((arg: selectedText) => {
    Vibration.vibrate(50);
    setRange({min: arg?.index, max: arg?.index});
    setSelectedText(arg);
  }, []);

  const SaveHandler = useCallback(() => {
    let TextChosen = '';

    if (selectedText?.text) {
      TextChosen = selectedText.text;
    } else if (Range.min != null && Range.max != null) {
      let i = Range.min;
      for (i; i <= Range?.max; i++) {
        TextChosen += Positions[i]?.text + ' ';
      }
    }
  }, [selectedText, Range]);

  return (
    <View {...panResponder.panHandlers} style={[styles.OuterView]}>
      <Pressable style={{flex: 1}} onPress={resetSelection}>
        {Positions.map((item, index: number) => {
          selectableRefs.current[index] = React.createRef();
          let isInRange = false;
          if (Range.min != null && Range.max != null) {
            isInRange = index >= Range?.min && index <= Range?.max;
          }
          return (
            <Pressable
              ref={selectableRefs.current[index]}
              style={[
                {
                  height: item?.height,
                  width: item?.width,
                  top: item?.top,
                  left: item?.left,
                  transform: [{rotate: `${item.rotate}deg`}],
                  backgroundColor:
                    selectedText?.index == index || isInRange
                      ? Colors.selected
                      : Colors.highlighted,
                },
                styles.highlightedText,
              ]}
              onPress={selectOneHandler.bind(null, {index, text: item.text})}
              key={index}>
              {selectedText?.index == index || Range.min == index ? (
                <View style={styles.topSelectable} />
              ) : null}
              {selectedText?.index == index || Range.max == index ? (
                <View style={styles.bottomSelectable} />
              ) : null}
            </Pressable>
          );
        })}
      </Pressable>
    </View>
  );
};

const GoogleLens = ({route}: ScreenProps<AppScreens.GoogleLens>) => {
  const image = route.params.image;
  const [Positions, setPositions] = useState<positions[]>([]);
  const ViewRef = useRef<any>(null);

  const fetchImageDetails = async () => {
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

  return (
    <View style={[styles.GoogleLens]}>
      <ViewShot
        style={styles.GoogleLens}
        ref={ViewRef}
        options={{result: 'base64', quality: 1}}>
        <FastImage
          source={{uri: image, priority: FastImage.priority.high}}
          resizeMode="cover"
          style={styles.imageStyle}
          onLoadEnd={() => {
            setTimeout(() => {
              fetchImageDetails();
            }, 200);
          }}
        />
      </ViewShot>
      <SelectableView Positions={Positions} />
    </View>
  );
};

const styles = StyleSheet.create({
  GoogleLens: {
    flex: 1,
  },
  SaveButton: {
    padding: 5,
    alignItems: 'center',
    width: '100%',
    height: 50,
    justifyContent: 'center',
    // borderRadius: 10,
  },
  imageStyle: {flex: 1},
  highlightedText: {
    borderRadius: 3,
    position: 'absolute',
    flexDirection: 'row',
    zIndex: -1,
    overflow: 'visible',
  },
  OuterView: {
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    position: 'absolute',
    backgroundColor: '#00000046',
    overflow: 'visible',
  },
  topSelectable: {
    height: 25,
    width: 25,
    borderTopEndRadius: 12,
    borderTopStartRadius: 12,
    borderBottomEndRadius: 12,
    transform: [{rotate: '-90deg'}],
    backgroundColor: '#0e51d5',
    top: -25,
    left: -25,
    zIndex: 1,
    overflow: 'hidden',
  },
  bottomSelectable: {
    height: 25,
    width: 25,
    borderTopEndRadius: 12,
    borderTopStartRadius: 12,
    borderBottomEndRadius: 12,
    transform: [{rotate: '90deg'}],
    backgroundColor: '#0e51d5',
    bottom: -25,
    right: -25,
    alignSelf: 'flex-end',
    position: 'absolute',
    overflow: 'hidden',
    zIndex: 1,
  },
});

export default memo(GoogleLens);
