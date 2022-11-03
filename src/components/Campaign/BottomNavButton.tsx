import { CampaignData } from '@src/@types';
import React, { useEffect, useState } from 'react';
import { useRecoilState } from 'recoil';
import { userAccessToken, userState } from '@src/states';
import Config from 'react-native-config';
import axios from 'axios';
import ToCompleteButton from './ToCompleteButton';
import CompleteButton from './CompleteButton';
import StatusChangeButton from './StatusChangeButton';
import JoinButton from './JoinButton';
import IngButton from './IngButton';

interface BottomNavProps {
  campaignDetail: CampaignData;
  setCampaignDetail: any;
}

function BottomNavButton({ campaignDetail, setCampaignDetail }: BottomNavProps) {
  const { hostId, campaignId, campaignStatus } = campaignDetail;
  const userInfo = useRecoilState(userState)[0];
  const accessToken = useRecoilState(userAccessToken)[0];

  const [isHost, setHost] = useState(false);
  const [inCampaign, setInCampaign] = useState(false);

  useEffect(() => {
    const setInfo = async () => {
      if (userInfo.userId === hostId) {
        setHost(true);
      } else {
        const isInCampaign = await axios.get(
          `${Config.API_URL}/campaign/join/in/${campaignId}`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          },
        );
        setInCampaign(isInCampaign.data.data);
      }
    };

    setInfo();
  }, []);

  if (isHost) {
    return <StatusChangeButton
      campaignDetail={campaignDetail}
      setCampaignDetail={setCampaignDetail}
    />;
  }

  if (inCampaign) {
    if (campaignStatus === 'COMPLETE') {
      return <CompleteButton />;
    }
    if (campaignStatus === 'DELIVERED' || campaignStatus === 'DISTRIBUTING') {
      return <ToCompleteButton />;
    }
    return <IngButton status={campaignStatus} />;
  }

  return <JoinButton campaignDetail={campaignDetail} />;
}

export default BottomNavButton;