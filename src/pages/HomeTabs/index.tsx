import React from 'react';
import Icon from 'react-native-vector-icons/Ionicons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Home from './Home';
import Manage from './Manage';
import ChatList from './ChatList';
import Mypage from './Mypage';

const Tab = createBottomTabNavigator();

function HomeTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName = '';
          const iconSize = route.name === 'Manage' ? 32 : size;
          if (route.name === 'Home') {
            iconName = focused
              ? 'home'
              : 'home-outline';
          } else if (route.name === 'Manage') {
            iconName = focused ? 'cart' : 'cart-outline';
          } else if (route.name === 'ChatList') {
            iconName = focused ? 'chatbubble-ellipses' : 'chatbubble-ellipses-outline';
          } else if (route.name === 'Mypage') {
            iconName = focused ? 'person' : 'person-outline';
          }

          // You can return any component that you like here!
          return <Icon name={iconName} size={iconSize} color={color} />;
        },
        tabBarActiveTintColor: 'black',
        tabBarInactiveTintColor: 'gray',
      })}>
      <Tab.Screen
        name="Home"
        component={Home}
        options={{
          headerShown: false,
          tabBarLabel: '홈',
          tabBarLabelStyle: {
            fontSize: 14,
          },
        }}
      />
      <Tab.Screen
        name="Manage"
        component={Manage}
        options={{
          headerShown: false,
          tabBarLabel: '캠페인관리',
          tabBarLabelStyle: {
            fontSize: 14,
          },
        }}
        />
      <Tab.Screen
        name="ChatList"
        component={ChatList}
        options={{
          title: '채팅 목록',
          tabBarLabel: '채팅',
          tabBarLabelStyle: {
            fontSize: 14,
          },
        }}
      />
      <Tab.Screen
        name="Mypage"
        component={Mypage}
        options={{
          headerShown: false,
          tabBarLabel: '내정보',
          tabBarLabelStyle: {
            fontSize: 14,
          },
        }}
      />
  </Tab.Navigator>);
}

export default HomeTabs;