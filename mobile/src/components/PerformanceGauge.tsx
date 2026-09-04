import { useEffect, useMemo, useRef, useState } from "react";
import { Animated, StyleSheet, View } from "react-native";
import { Text } from "@/components/AppText";
import Svg, { Circle } from "react-native-svg";
import { theme } from "@/theme";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

type Props = {
  label: string;
  value: number | null;
  max?: number;
  colour: string;
  suffix?: string;
  precision?: number;
  status: string;
  size?: number;
};

export function PerformanceGauge({ label, value, max = 100, colour, suffix = "", precision = 0, status, size = 92 }: Props) {
  const radius = (size - 12) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = useRef(new Animated.Value(0)).current;
  const [shown, setShown] = useState(0);
  const target = value == null ? 0 : Math.max(0, Math.min(1, value / max));
  const dashOffset = useMemo(() => progress.interpolate({ inputRange: [0, 1], outputRange: [circumference, 0] }), [progress, circumference]);

  useEffect(() => {
    const listener = progress.addListener(({ value: current }) => setShown(current * (value ?? 0)));
    Animated.spring(progress, { toValue: target, damping: 18, stiffness: 85, mass: .8, useNativeDriver: false }).start();
    return () => progress.removeListener(listener);
  }, [progress, target, value]);

  return <View style={[s.wrap,{width:size}]} accessibilityLabel={`${label}: ${value == null ? "no data" : `${value}${suffix}`}. ${status}`}>
    <View style={[s.glow,{width:size-12,height:size-12,borderRadius:size/2,shadowColor:colour}]} />
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={s.svg}>
      <Circle cx={size/2} cy={size/2} r={radius} stroke={theme.lineStrong} strokeWidth={6} fill="none" opacity={.72}/>
      <AnimatedCircle cx={size/2} cy={size/2} r={radius} stroke={colour} strokeWidth={6} fill="none" strokeLinecap="round" strokeDasharray={`${circumference} ${circumference}`} strokeDashoffset={dashOffset} rotation={-90} origin={`${size/2}, ${size/2}`}/>
      <Circle cx={size/2} cy={6} r={2.3} fill={value == null ? theme.lineStrong : colour}/>
    </Svg>
    <View style={s.center}><Text style={s.value}>{value == null ? "—" : `${shown.toFixed(precision)}${suffix}`}</Text><Text style={[s.status,{color:value == null?theme.muted:colour}]}>{status}</Text></View>
    <Text style={s.label}>{label}</Text>
  </View>;
}

const s=StyleSheet.create({wrap:{alignItems:"center"},svg:{transform:[{rotate:"0deg"}]},glow:{position:"absolute",top:6,shadowOpacity:.28,shadowRadius:14,shadowOffset:{width:0,height:0}},center:{position:"absolute",top:0,left:0,right:0,height:92,alignItems:"center",justifyContent:"center"},value:{color:theme.ink,fontSize:17,fontWeight:"900",letterSpacing:-.5},status:{fontSize:10,fontWeight:"900",letterSpacing:.8,textTransform:"uppercase",marginTop:2},label:{color:theme.ink2,fontSize:10,fontWeight:"900",letterSpacing:1.1,textTransform:"uppercase",marginTop:7}});
