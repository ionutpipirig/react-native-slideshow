import React, { useState, useEffect, useRef } from "react";
import PropTypes from "prop-types";
import {
  Image,
  Text,
  View,
  ScrollView,
  StyleSheet,
  Animated,
  PanResponder,
  TouchableHighlight,
  TouchableOpacity,
  Dimensions,
} from "react-native";

const Slideshow = ({
  dataSource,
  indicatorSize = 8,
  indicatorColor = "#CCCCCC",
  indicatorSelectedColor = "#FFFFFF",
  height = 300,
  position: initialPosition,
  scrollEnabled = true,
  containerStyle,
  overlay,
  arrowSize = 16,
  arrowLeft,
  arrowRight,
  onPress,
  onPositionChanged,
}) => {
  const [position, setPosition] = useState(initialPosition || 0);
  const [windowWidth, setWindowWidth] = useState(
    Dimensions.get("window").width
  );
  const scrollViewRef = useRef(null);
  const intervalRef = useRef(null);
  const width = useRef(Dimensions.get("window").width);
  const heightRef = useRef(height);

  useEffect(() => {
    const release = (e, gestureState) => {
      const relativeDistance = gestureState.dx / width.current;
      const vx = gestureState.vx;
      let change = 0;

      if (relativeDistance < -0.5 || (relativeDistance < 0 && vx <= 0.5)) {
        change = 1;
      } else if (
        relativeDistance > 0.5 ||
        (relativeDistance > 0 && vx >= 0.5)
      ) {
        change = -1;
      }
      const currentPosition = getPosition();
      let newPosition = currentPosition + change;

      if (newPosition < 0) {
        newPosition = 0;
      } else if (newPosition >= dataSource.length) {
        newPosition = dataSource.length - 1;
      }

      move(newPosition);
      return true;
    };

    const panResponder = PanResponder.create({
      onPanResponderRelease: release,
    });

    const interval = setInterval(() => {
      const newWindowWidth = Dimensions.get("window").width;
      if (newWindowWidth !== windowWidth) {
        setWindowWidth(newWindowWidth);
        width.current = newWindowWidth;
      }
    }, 100);

    intervalRef.current = interval;

    return () => {
      clearInterval(intervalRef.current);
    };
  }, []);

  useEffect(() => {
    if (onPositionChanged) {
      onPositionChanged(position);
    }
  }, [position]);

  const move = (index) => {
    const newPosition = index >= 0 ? index : 0;
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollTo({
        x: width.current * newPosition,
        animated: true,
      });
      setPosition(newPosition);
    }
  };

  const getPosition = () => position;

  const next = () => {
    const newPosition = position + 1;
    if (newPosition < dataSource.length) {
      move(newPosition);
    }
  };

  const prev = () => {
    const newPosition = position - 1;
    if (newPosition >= 0) {
      move(newPosition);
    }
  };

  const renderIndicator = (idx) => {
    const isCurrentPosition = idx === position;
    return (
      <View
        key={idx}
        style={[
          styles.indicator,
          {
            backgroundColor: isCurrentPosition
              ? indicatorSelectedColor
              : indicatorColor,
            width: indicatorSize,
            height: indicatorSize,
            margin: 4,
          },
        ]}
      />
    );
  };

  const renderArrow = (direction) => {
    const arrow = direction === "left" ? arrowLeft : arrowRight;
    const isDisabled =
      (direction === "left" && position === 0) ||
      (direction === "right" && position === dataSource.length - 1);

    if (!arrow) {
      return null;
    }

    return (
      <TouchableOpacity
        disabled={isDisabled}
        style={styles.arrow}
        onPress={() => {
          if (direction === "left") {
            prev();
          } else {
            next();
          }
        }}
      >
        <Image
          source={arrow}
          style={[styles.arrowImage, { width: arrowSize, height: arrowSize }]}
        />
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, containerStyle]}>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onLayout={(event) => {
          const { width } = event.nativeEvent.layout;
          width.current = width;
        }}
        scrollEnabled={scrollEnabled}
        scrollEventThrottle={200}
        onScroll={(event) => {
          const offsetX = event.nativeEvent.contentOffset.x;
          const newPage = Math.round(offsetX / width.current);
          setPosition(newPage);
        }}
      >
        {dataSource.map((image, idx) => (
          <TouchableHighlight
            key={idx}
            underlayColor="transparent"
            onPress={() => {
              if (onPress) {
                onPress(position);
              }
            }}
          >
            <Image
              style={[
                styles.image,
                { width: windowWidth, height: heightRef.current },
              ]}
              source={{ uri: image.url }}
            />
          </TouchableHighlight>
        ))}
      </ScrollView>
      {overlay && (
        <View style={[StyleSheet.absoluteFill, styles.overlay]}>
          <Text style={styles.overlayText}>{overlay}</Text>
        </View>
      )}
      <View style={styles.indicatorContainer}>
        {dataSource.map((_, idx) => renderIndicator(idx))}
      </View>
      {renderArrow("left")}
      {renderArrow("right")}
    </View>
  );
};

Slideshow.propTypes = {
  dataSource: PropTypes.arrayOf(
    PropTypes.shape({
      url: PropTypes.string.isRequired,
    })
  ).isRequired,
  indicatorSize: PropTypes.number,
  indicatorColor: PropTypes.string,
  indicatorSelectedColor: PropTypes.string,
  height: PropTypes.number,
  position: PropTypes.number,
  scrollEnabled: PropTypes.bool,
  containerStyle: PropTypes.object,
  overlay: PropTypes.node,
  arrowSize: PropTypes.number,
  arrowLeft: PropTypes.number,
  arrowRight: PropTypes.number,
  onPress: PropTypes.func,
  onPositionChanged: PropTypes.func,
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: "relative",
  },
  image: {
    resizeMode: "cover",
  },
  indicatorContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    position: "absolute",
    bottom: 16,
    left: 0,
    right: 0,
  },
  indicator: {
    borderRadius: 4,
  },
  overlay: {
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  overlayText: {
    color: "#FFFFFF",
    fontSize: 24,
  },
  arrow: {
    position: "absolute",
    top: "50%",
    marginTop: -16,
  },
  arrowImage: {
    resizeMode: "contain",
  },
});

export default Slideshow;
