export const getInviteLink = (inviteCode: string): string => {
  // В React Native используем deep linking
  return `lovetracker://invite/${inviteCode}`;
};

