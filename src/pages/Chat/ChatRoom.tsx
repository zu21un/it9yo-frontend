import React, {
  useState, useCallback, useEffect, useRef,
} from 'react';
import AsyncStorage from '@react-native-community/async-storage';

import messaging from '@react-native-firebase/messaging';
import { CampaignData, JoinUserInfo, ReceivedMessageData } from '@src/@types';

import { GiftedChat, type IMessage } from 'react-native-gifted-chat';
import { useRecoilState, useSetRecoilState } from 'recoil';
import { currentChatRoomId, userAccessToken, userState } from '@src/states';
import axios from 'axios';
import Config from 'react-native-config';

// test
import Toast from 'react-native-toast-message';

import {
  ActivityIndicator,
  Button, DrawerLayoutAndroid, FlatList, Image, StyleSheet, Text, View,
} from 'react-native';

import DrawerButton from '@components/Header/DrawerButton';
import StatusNameList from '@src/constants/statusname';
import EachUser from '@src/components/EachUser';

const pageSize = 10;

function ChatRoom({ navigation, route }) {
  const userInfo = useRecoilState(userState)[0];
  const accessToken = useRecoilState(userAccessToken)[0];
  const setChatRoomId = useSetRecoilState(currentChatRoomId);

  const { campaignId } = route.params;
  const [messages, setMessages] = useState<IMessage[]>([]);

  const [userList, setUserList] = useState<JoinUserInfo[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [noMoreData, setNoMoreData] = useState(false);

  const [loading, setLoading] = useState(false);

  const [campaignData, setCampaignData] = useState<CampaignData | undefined>();

  const drawer = useRef(null);

  useEffect(() => {
    navigation.setOptions({
      headerTitle: route.params.title,
      headerRight: () => <DrawerButton onPress={() => drawer.current.openDrawer()}/>,
    });
  }, [navigation, route]);

  useEffect(() => {
    console.log(drawer.current);
  }, [drawer.current]);

  useEffect(() => {
    setChatRoomId(campaignId);
    initChatData();
    loadCampaignDetail();
    loadUserData();

    return () => {
      setChatRoomId(null);
    };
  }, []);

  // 메시지 전송 받기
  useEffect(() => {
    const unsubscribe = messaging().onMessage(async (remoteMessage) => {
      const { messageId, notification, sentTime } = remoteMessage;
      if (!notification || !notification.body) return;

      const receivedMessage = JSON.parse(notification.body);
      if (receivedMessage.campaignId !== campaignId) return;

      receiveMessage({ ...receivedMessage, messageId, sentTime });
      const { nickName, content, campaignTitle } = receivedMessage;

      // test
      Toast.show({
        text1: nickName,
        text2: content,
        onPress: () => {
          Toast.hide();
          navigation.navigate('ChatRoom', { campaignId, title: campaignTitle });
        },
      });
    });

    return unsubscribe;
  }, []);

  const loadCampaignDetail = async () => {
    if (loading) return;
    try {
      const response = await axios.get(
        `${Config.API_URL}/campaign/detail/${campaignId}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );
      if (response.status === 200) {
        const campaignDetailData: CampaignData = response.data.data;
        setCampaignData(campaignDetailData);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const loadUserData = async () => {
    try {
      setLoading(true);
      const url = `${Config.API_URL}/campaign/detail/v2/${campaignId}?size=${pageSize}&page=${currentPage}&sort=createdDate&direction=DESC`;
      const response = await axios.get(
        url,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

      if (response.status === 200) {
        const { userInfos } = response.data.data;
        const {
          content, first, last, number, empty,
        } = userInfos;
        if (empty) return;
        if (first) {
          setUserList([...content]);
        } else {
          setUserList((prev) => [...prev, ...content]);
        }
        setCurrentPage(number + 1);
        if (last) {
          setNoMoreData(true);
        } else {
          setNoMoreData(false);
        }
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const onEndReached = () => {
    if (!noMoreData || !loading) {
      loadUserData();
    }
  };

  const initChatData = async () => {
    try {
      const list = await AsyncStorage.getItem(`chatMessages_${campaignId}`);
      if (list !== null) {
        setMessages(JSON.parse(list));
      } else {
        const initMsg: IMessage[] = [{
          _id: 0,
          text: `${userInfo.nickName}님이 캠페인에 참여하셨습니다.`,
          createdAt: new Date(),
          user: {
            _id: 0,
            name: 'React Native',
          },
          system: true,
        }];
        AsyncStorage.setItem(`chatMessages_${campaignId}`, JSON.stringify(initMsg));
        setMessages(initMsg);
      }
    } catch (err) {
      console.log(err);
    }
  };

  const receiveMessage = async ({
    messageId,
    sentTime,
    userId,
    nickName,
    content,
    profileImageUrl,
    userChat,
  }: ReceivedMessageData) => {
    if (!sentTime || !messageId) return;

    const newMessage: IMessage = {
      _id: messageId,
      text: content,
      createdAt: new Date(sentTime),
      user: {
        _id: userId,
        name: nickName,
        avatar: profileImageUrl,
      },
      system: !userChat,
    };
    setMessages((prev) => [newMessage, ...prev]);
    await AsyncStorage.setItem(`chatMessages_${campaignId}`, JSON.stringify([newMessage, ...messages]));
  };

  const sendMessage = async (text: string) => {
    try {
      const response = await axios.post(
        `${Config.API_URL}/chat/publish/${campaignId}`,
        {
          content: text,
          userChat: true,
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );
      console.log(response);
    } catch (error) {
      console.error(error);
    }
  };
  const onSend = useCallback((message: IMessage[]) => {
    console.log(message);
    sendMessage(message[0].text);
  }, []);

  const renderItem = ({ item }: { item: JoinUserInfo }) => (
    <EachUser item={item} campaignData={campaignData} />
  );

  const ChatRoomDrawer = () => (
    <View style={styles.container}>
      {campaignData
      && <>
        <View style={styles.campaignInfoZone}>
          <Image style={styles.campaignThumbnail} source={{ uri: campaignData.itemImageURLs[0] }} />

          <View>
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>{StatusNameList[campaignData.campaignStatus]}</Text>
            </View>

            <Text style={styles.campaignInfoText}>{campaignData.title}</Text>

            {/* <Text style={styles.campaignInfoText}>{`${numberWithCommas(itemPrice)} 원`}</Text> */}
          </View>

        </View>

        <View style={styles.userListContainer}>
          {/* 참여중인 인원 */}
          <View style={styles.userCntZone}>
            <Text style={styles.userCntText}>총 </Text>
            <Text style={{ ...styles.userCntText, fontWeight: 'bold' }}>{campaignData.participatedPersonCnt}명</Text>
            <Text style={styles.userCntText}> 참여중</Text>
          </View>

          {/* 유저 정보 리스트 */}
          {userList.length > 0 && <FlatList
            data={userList}
            keyExtractor={(item) => `userList_${item.userId.toString()}`}
            renderItem={renderItem}
            onEndReached={onEndReached}
            onEndReachedThreshold={1}
            ListFooterComponent={!noMoreData && loading && <ActivityIndicator />}
          />}
        </View>
      </>}

    </View>
  );

  return (
    <DrawerLayoutAndroid
      ref={drawer}
      drawerWidth={300}
      drawerPosition="right"
      renderNavigationView={ChatRoomDrawer}
    >
      <GiftedChat
        messages={messages}
        onSend={(message) => onSend(message)}
        user={{
          _id: userInfo.userId,
        }}
      />
    </DrawerLayoutAndroid>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    flex: 1,
  },
  campaignInfoZone: {
    height: 140,
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 30,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderColor: '#eeeeee',
  },
  campaignThumbnail: {
    width: 100,
    height: 100,
    borderRadius: 8,
    marginRight: 15,
  },
  statusBadge: {
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 3,
    paddingVertical: 2,
    borderRadius: 17,
    backgroundColor: '#fae5d2',
    marginBottom: 5,
  },
  statusText: {
    fontFamily: 'SpoqaHanSansNeo',
    fontSize: 12,
    fontWeight: '700',
    fontStyle: 'normal',
    letterSpacing: 0,
    color: '#e27919',
  },
  campaignInfoText: {
    fontFamily: 'SpoqaHanSansNeo',
    fontSize: 18,
    fontWeight: 'normal',
    fontStyle: 'normal',
    letterSpacing: 0,
    color: '#282828',
    marginBottom: 5,
  },
  userListContainer: {
    padding: 20,
  },
  userCntZone: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  userCntText: {
    fontFamily: 'SpoqaHanSansNeo',
    fontSize: 14,
    fontWeight: 'normal',
    fontStyle: 'normal',
    letterSpacing: 0,
    color: '#3b3b3b',
  },
});

export default ChatRoom;
