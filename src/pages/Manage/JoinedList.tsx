import { userAccessToken } from '@src/states';
import axios from 'axios';
import React, { useEffect } from 'react';
import { View } from 'react-native';
import Config from 'react-native-config';
import { useRecoilState } from 'recoil';

function JoinedList() {
  const accessToken = useRecoilState(userAccessToken)[0];

  useEffect(() => {
    const loadData = async () => {
      try {
        const url = `${Config.API_URL}/campaign/createByMe?status=RECRUITING&size=2&page=0&sort=createdDate&direction=DESC`;
        const response = await axios.get(
          url,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          },
        );
        console.log('JoinedList start', response);
      } catch (error) {
        console.error(error);
      }
    };

    loadData();
  }, []);

  return <View style={{ flex: 1, backgroundColor: '#ff4081' }} />;
}

export default JoinedList;