import { Pressable, View } from 'react-native';
import { AudioLines, Download, Home, Mic, User } from 'lucide-react-native';
import { Tabs } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Text, useThemeColor } from 'heroui-native';
import { useUniwind } from 'uniwind';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';

import { Gradient } from '@/components/Gradient';

const TAB_META: Record<string, { label: string; icon: typeof Home }> = {
  index: { label: 'Home', icon: Home },
  assistant: { label: 'Assistant', icon: Mic },
  activity: { label: 'Activity', icon: Download },
  profile: { label: 'Profile', icon: User },
};

// Order the four labeled tabs; the center orb is injected between assistant & activity.
const LEFT_TABS = ['index', 'assistant'];
const RIGHT_TABS = ['activity', 'profile'];

function CustomTabBar({ state, navigation }: BottomTabBarProps) {
  const [background, border, accent, muted, foreground] = useThemeColor([
    'background',
    'border',
    'accent',
    'muted',
    'foreground',
  ]);

  const activeRouteName = state.routes[state.index]?.name;

  const renderTab = (name: string) => {
    const route = state.routes.find((r) => r.name === name);
    if (!route) return null;
    const meta = TAB_META[name];
    const Icon = meta.icon;
    const focused = activeRouteName === name;
    const color = focused ? accent : muted;

    return (
      <Pressable
        key={name}
        onPress={() => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          if (!focused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        }}
        className="flex-1 items-center justify-center gap-1 py-1"
      >
        <Icon color={color} size={22} />
        <Text style={{ color }} className="text-[11px]">
          {meta.label}
        </Text>
      </Pressable>
    );
  };

  const centerActive = activeRouteName === 'assistant';

  return (
    <View
      style={{ backgroundColor: background, borderTopColor: border }}
      className="pb-safe-offset-2 flex-row items-end border-t px-2 pt-2"
    >
      {LEFT_TABS.map(renderTab)}

      {/* Center elevated voice button -> Assistant */}
      <View className="flex-1 items-center">
        <Pressable
          onPress={() => navigation.navigate('assistant')}
          style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1, marginTop: -28 })}
        >
          <Gradient
            colors={[accent, '#8b5cf6']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              width: 56,
              height: 56,
              borderRadius: 28,
              shadowColor: accent,
              shadowOpacity: centerActive ? 0.7 : 0.4,
              shadowRadius: 16,
              shadowOffset: { width: 0, height: 0 },
              borderWidth: 3,
              borderColor: background,
            }}
            className="items-center justify-center"
          >
            <AudioLines color={foreground} size={26} />
          </Gradient>
        </Pressable>
      </View>

      {RIGHT_TABS.map(renderTab)}
    </View>
  );
}

export default function TabLayout() {
  const { theme } = useUniwind();
  const [background, foreground] = useThemeColor(['background', 'foreground']);

  return (
    <>
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
      <Tabs
        tabBar={(props) => <CustomTabBar {...props} />}
        screenOptions={{
          headerShown: false,
          headerStyle: { backgroundColor: background },
          headerTintColor: foreground,
          sceneStyle: { backgroundColor: background },
        }}
      >
        <Tabs.Screen name="index" options={{ title: 'Home' }} />
        <Tabs.Screen name="assistant" options={{ title: 'Assistant' }} />
        <Tabs.Screen name="activity" options={{ title: 'Activity' }} />
        <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
      </Tabs>
    </>
  );
}
