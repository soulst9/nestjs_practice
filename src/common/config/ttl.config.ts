export const TTLConfig = {

  duration: {
    immediate: 60, // 즉시
    hourly: 3600, // 기본 1시간으로 설정
    daily: 86400, // 1일
    weekly: 604800, // 1주
    monthly: 2592000, // 1달
    yearly: 31536000, // 1년
  },

  until: {
    at2AM(): Date {
      return this.at(2, 0);
    },
    at(hour: number, minute: number): Date {
      const now = Date.now();
      const target = new Date();

      // 한국 시간(KST) 기준으로 시간 설정 후 UTC로 변환
      const kstOffset = 9;
      target.setUTCHours(hour - kstOffset, minute, 0, 0);

      // 현재 시간이 목표 시간을 지났으면 다음 날로 설정
      if (now >= target.getTime()) {
        target.setUTCDate(target.getUTCDate() + 1);
      }

      return target;
    },
  }
} as const;