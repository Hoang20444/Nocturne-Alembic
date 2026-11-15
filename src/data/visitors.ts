import { VisitorOrder } from '../game/types';

export const VISITOR_ORDERS: VisitorOrder[] = [
  {
    id: 'v_clockmaker_1',
    visitorName: { vi: 'Ông Lão Thợ Đồng Hồ', en: 'Master Horologist' },
    visitorTitle: { vi: 'Kẻ Đếm Giờ Mất Ngủ', en: 'The Sleepless Clockmaker' },
    portraitGlyph: '🕰️',
    dialogue: {
      vi: '“Bánh răng đồng hồ tháp chuông bị đóng băng bởi sương đêm rồi. Cho ta một lọ Tinh Dầu Sương Khói để làm ấm các trục quay...”',
      en: '“The belltower gears have seized in the midnight frost. Brew me a Steam Vapor Elixir to warm the escapement...”'
    },
    thankYou: {
      vi: '“Hơi ấm dịu kỳ! Tiếng tích tắc lại vang lên chuẩn xác rồi.”',
      en: '“Wondrous warmth! The pendulum swings true once more.”'
    },
    requiredElements: ['steam_vapor'],
    goldReward: 65,
    reputationReward: 10,
    minNight: 1
  },
  {
    id: 'v_herbalist_1',
    visitorName: { vi: 'Cô Bé Bán Hoa Đêm', en: 'Liora of the Conservatory' },
    visitorTitle: { vi: 'Người Giữ Vườn Kính', en: 'Glasshouse Keeper' },
    portraitGlyph: '🥀',
    dialogue: {
      vi: '“Đóa quỳnh hương cuối cùng sắp héo rũ trước bình minh. Ngài có thể chưng cất một giọt Cam Lộ Trường Sinh giúp cháu không?”',
      en: '“My last night-blooming orchid is wilting before dawn. Could you distill a drop of Nectar of Dew?”'
    },
    thankYou: {
      vi: '“Nhìn kìa, cánh hoa đang tỏa sáng trở lại! Cảm ơn ngài Giả Kim!”',
      en: '“Look, the petals are glowing again! Thank you, Alchemist!”'
    },
    requiredElements: ['nectar_dew'],
    goldReward: 70,
    reputationReward: 12,
    minNight: 1
  },
  {
    id: 'v_lantern_1',
    visitorName: { vi: 'Người Gác Đèn Đêm', en: 'Garrick the Lamplighter' },
    visitorTitle: { vi: 'Tuần Đêm Phố Cổ', en: 'Old Quarter Warden' },
    portraitGlyph: '🏮',
    dialogue: {
      vi: '“Mưa lớn làm tắt hết đèn đường ở bến cảng. Ta cần một viên Hổ Phách Lửa Rừng hoặc Hạt Nhân Mặt Trời cháy xuyên mưa gió!”',
      en: '“The downpour keeps snuffing out the harbor lamps. I need Wildfire Amber that burns through the storm!”'
    },
    thankYou: {
      vi: '“Ánh lửa vàng rực này không cơn bão nào dập tắt nổi!”',
      en: '“No squall on earth could extinguish this golden flame!”'
    },
    requiredElements: ['wildfire_amber'],
    goldReward: 80,
    reputationReward: 14,
    minNight: 1
  },
  {
    id: 'v_frost_singer',
    visitorName: { vi: 'Ca Nương Nhà Hát Cổ', en: 'Seraphina the Soprano' },
    visitorTitle: { vi: 'Giọng Ca Pha Lê', en: 'The Crystal Voice' },
    portraitGlyph: '🎭',
    dialogue: {
      vi: '“Đêm nay ta phải hát khúc aria cuối cùng, nhưng cổ họng khô rát. Hãy kết tinh cho ta một viên Ngọc Băng Giá và một Cam Lộ Trường Sinh.”',
      en: '“I perform the final aria tonight, yet my voice falters. Crystallize a Frost Pearl and Nectar of Dew for me.”'
    },
    thankYou: {
      vi: '“Trong trẻo tựa tiếng chuông ngân! Đêm nay nhà hát sẽ chấn động.”',
      en: '“Clear as a silver bell! Tonight the opera house shall tremble.”'
    },
    requiredElements: ['frost_pearl', 'nectar_dew'],
    goldReward: 135,
    reputationReward: 20,
    minNight: 1
  },
  {
    id: 'v_crow_familiar',
    visitorName: { vi: 'Quạ Đầm Lầy Muninn', en: 'Muninn the Bog Crow' },
    visitorTitle: { vi: 'Sứ Giả Phù Thủy Rừng', en: 'Witch’s Courier' },
    portraitGlyph: '🐦‍⬛',
    dialogue: {
      vi: '“Quác! Chủ nhân ta cần một Trái Tim Nhân Sâm và một Hạt Nhân Mặt Trời trước khi trăng lên đỉnh đầu!”',
      en: '“Caw! My mistress demands a Mandrake Heart and a Solar Core before the moon reaches its zenith!”'
    },
    thankYou: {
      vi: '“Quác! Vàng thật đấy, không phải lá khô đâu. Hẹn gặp lại!”',
      en: '“Caw! Real gold coins, not enchanted leaves. Until next moon!”'
    },
    requiredElements: ['mandrake_heart', 'solar_core'],
    goldReward: 150,
    reputationReward: 22,
    minNight: 2
  },
  {
    id: 'v_cartographer',
    visitorName: { vi: 'Nhà Bản Đồ Tinh Tú', en: 'Astrolabe Cassian' },
    visitorTitle: { vi: 'Kẻ Vẽ Đường Sao', en: 'Celestial Cartographer' },
    portraitGlyph: '🔭',
    dialogue: {
      vi: '“Các chòm sao đang dịch chuyển kỳ lạ. Ta cần Nước Mắt Thủy Triều và Lăng Kính Tinh Tú để hiệu chỉnh kính viễn vọng.”',
      en: '“The constellations are drifting. I require Tideweaver Tears and an Astral Prism to calibrate my lens.”'
    },
    thankYou: {
      vi: '“Ta đã thấy được đường chân trời ẩn giấu phía sau màn mưa!”',
      en: '“I can finally see the hidden horizon beyond the rain!”'
    },
    requiredElements: ['tideweaver_tears', 'astral_prism'],
    goldReward: 185,
    reputationReward: 26,
    minNight: 2
  },
  {
    id: 'v_moth_scholar',
    visitorName: { vi: 'Học Giả Thư Viện Ngầm', en: 'Archivist Vespera' },
    visitorTitle: { vi: 'Người Đọc Sách Mộng', en: 'Keeper of Forbidden Folios' },
    portraitGlyph: '📜',
    dialogue: {
      vi: '“Những trang cổ thư chỉ hiện chữ dưới ánh sáng của Tinh Linh Mộng Mị và Lửa Nhật Thực. Ngài pha giúp tôi nhé?”',
      en: '“These ancient vellum pages only reveal their ink under a Dreamspore Spirit and Eclipse Starfire.”'
    },
    thankYou: {
      vi: '“Những dòng chữ cổ đang nhảy múa! Đây là thù lao xứng đáng cho ngài.”',
      en: '“The cipher dances into view! Take this generous purse of gold.”'
    },
    requiredElements: ['dreamspore_spirit', 'eclipse_starfire'],
    goldReward: 210,
    reputationReward: 30,
    minNight: 2
  },
  {
    id: 'v_hollow_alchemist',
    visitorName: { vi: 'Giả Kim Thuật Sư Ẩn Danh', en: 'The Veiled Grandmaster' },
    visitorTitle: { vi: 'Hội đồng Hoàng Kim', en: 'Order of the Aureate Rose' },
    portraitGlyph: '👑',
    dialogue: {
      vi: '“Ta nghe đồn tiệm nhỏ này có thể hợp nhất hai Tinh Dầu Bậc 2 để rèn nên Đá Triết Gia huyền thoại. Hãy chứng minh cho ta thấy!”',
      en: '“Rumors whisper that this humble shop can fuse two Tier-2 Elixirs into the legendary Philosopher’s Stone. Prove it to me!”'
    },
    thankYou: {
      vi: '“Không thể tin được... Ánh hào quang bất diệt của Đá Triết Gia! Danh tiếng của ngài sẽ vang danh khắp thành phố!”',
      en: '“Astonishing... The immortal radiance of the Magnum Opus! Your name shall echo across the capital!”'
    },
    requiredElements: ['philosopher_stone'],
    goldReward: 320,
    reputationReward: 50,
    minNight: 3
  }
];

