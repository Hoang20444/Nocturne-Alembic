import { ElementDef, ElementId, RecipeDef } from '../game/types';

export const ELEMENTS: Record<ElementId, ElementDef> = {
  aqua: {
    id: 'aqua',
    tier: 1,
    symbol: '💧',
    name: { vi: 'Thủy Tinh Khiết', en: 'Aqua Vitae' },
    desc: {
      vi: 'Giọt sương đêm thanh khiết thu từ mái hiên đá cổ. Nguyên tố nền tảng của mọi dung dịch.',
      en: 'Pure midnight dew gathered from ancient slate eaves. The foundation of liquid alchemy.'
    },
    color: '#38bdf8',
    glowColor: 'rgba(56, 189, 248, 0.55)',
    coreColor: '#e0f2fe',
    radius: 15,
    baseValue: 6,
    gravityScale: 1.0,
    bounciness: 0.78
  },
  ignis: {
    id: 'ignis',
    tier: 1,
    symbol: '🔥',
    name: { vi: 'Lửa Lưu Huỳnh', en: 'Ignis Sulfur' },
    desc: {
      vi: 'Tàn lửa đỏ rực nảy mạnh khi chạm pha lê, mang nhiệt lượng kích hoạt phản ứng nổ.',
      en: 'Volatile cinnabar ember that rebounds energetically off crystal nodes.'
    },
    color: '#fb7185',
    glowColor: 'rgba(251, 113, 133, 0.58)',
    coreColor: '#ffe4e6',
    radius: 15,
    baseValue: 7,
    gravityScale: 1.04,
    bounciness: 0.85
  },
  vitae: {
    id: 'vitae',
    tier: 1,
    symbol: '🌿',
    name: { vi: 'Rêu Sinh Mệnh', en: 'Vitae Moss' },
    desc: {
      vi: 'Bào tử phát quang trích xuất từ rễ cây cổ thụ. Dễ dàng kết dính và nuôi dưỡng chốt pha lê.',
      en: 'Bioluminescent spore drawn from deep roots. Harmonizes with surrounding crystal pegs.'
    },
    color: '#34d399',
    glowColor: 'rgba(52, 211, 153, 0.55)',
    coreColor: '#d1fae5',
    radius: 15,
    baseValue: 7,
    gravityScale: 0.95,
    bounciness: 0.75
  },
  lunar: {
    id: 'lunar',
    tier: 1,
    symbol: '🌙',
    name: { vi: 'Bụi Ánh Trăng', en: 'Lunar Dust' },
    desc: {
      vi: 'Tinh thể bạc rơi xuống vào đêm trăng khuyết. Nhẹ bẫng và mang ma lực cộng hưởng cao.',
      en: 'Silver stardust condensed under a crescent moon. Low gravity and high resonance.'
    },
    color: '#a78bfa',
    glowColor: 'rgba(167, 139, 250, 0.6)',
    coreColor: '#ede9fe',
    radius: 15,
    baseValue: 10,
    gravityScale: 0.84,
    bounciness: 0.82
  },

  // --- TIER 2: SAME-ELEMENT SYNTHESIS ---
  frost_pearl: {
    id: 'frost_pearl',
    tier: 2,
    symbol: '❄️',
    name: { vi: 'Ngọc Băng Giá', en: 'Frost Pearl' },
    desc: {
      vi: 'Kết tinh từ hai giọt Thủy Tinh Khiết. Nảy cực nhạy và tạo âm hưởng chuông băng.',
      en: 'Crystallized from twin Aqua drops. Rebounds with crisp glacial resonance.'
    },
    color: '#67e8f9',
    glowColor: 'rgba(103, 232, 249, 0.68)',
    coreColor: '#ecfeff',
    radius: 21,
    baseValue: 26,
    gravityScale: 1.0,
    bounciness: 0.86
  },
  solar_core: {
    id: 'solar_core',
    tier: 2,
    symbol: '☀️',
    name: { vi: 'Hạt Nhân Mặt Trời', en: 'Solar Core' },
    desc: {
      vi: 'Hai ngọn Lửa Lưu Huỳnh nén chặt thành cầu lửa vàng rực, phát sóng xung kích khi va chạm.',
      en: 'Twin Ignis embers fused into a miniature sun. Releases shockwaves upon impact.'
    },
    color: '#fb923c',
    glowColor: 'rgba(251, 146, 60, 0.7)',
    coreColor: '#ffedd5',
    radius: 21,
    baseValue: 30,
    gravityScale: 1.05,
    bounciness: 0.88,
    specialEffect: 'shockwave'
  },
  mandrake_heart: {
    id: 'mandrake_heart',
    tier: 2,
    symbol: '🌱',
    name: { vi: 'Trái Tim Nhân Sâm', en: 'Mandrake Heart' },
    desc: {
      vi: 'Tinh hoa Rêu Sinh Mệnh cô đặc, truyền sinh khí vào các chốt pha lê đi qua.',
      en: 'Concentrated Vitae essence that energizes nearby crystal pegs for bonus gold.'
    },
    color: '#10b981',
    glowColor: 'rgba(16, 185, 129, 0.68)',
    coreColor: '#ecfdf5',
    radius: 21,
    baseValue: 28,
    gravityScale: 0.94,
    bounciness: 0.8,
    specialEffect: 'energize_pegs'
  },
  astral_prism: {
    id: 'astral_prism',
    tier: 2,
    symbol: '🔮',
    name: { vi: 'Lăng Kính Tinh Tú', en: 'Astral Prism' },
    desc: {
      vi: 'Hai hạt Bụi Ánh Trăng kết tinh thành lăng kính bẻ cong trọng lực và nhân ba điểm cộng hưởng.',
      en: 'Fused Lunar Dust forming a cosmic prism that triples peg resonance gold.'
    },
    color: '#c084fc',
    glowColor: 'rgba(192, 132, 252, 0.72)',
    coreColor: '#faf5ff',
    radius: 22,
    baseValue: 38,
    gravityScale: 0.8,
    bounciness: 0.88,
    specialEffect: 'triple_peg'
  },

  // --- TIER 2: CROSS-ELEMENT ALCHEMY ---
  steam_vapor: {
    id: 'steam_vapor',
    tier: 2,
    symbol: '☁️',
    name: { vi: 'Tinh Dầu Sương Khói', en: 'Steam Vapor Elixir' },
    desc: {
      vi: 'Sự giao thoa giữa Nước và Lửa. Lơ lửng chậm rãi trong bình, chạm vào vô số chốt pha lê.',
      en: 'Born of Aqua and Ignis. Drifts gently through the vessel, grazing many crystal pegs.'
    },
    color: '#93c5fd',
    glowColor: 'rgba(147, 197, 253, 0.68)',
    coreColor: '#f8fafc',
    radius: 21,
    baseValue: 32,
    gravityScale: 0.62,
    bounciness: 0.9,
    specialEffect: 'floaty'
  },
  nectar_dew: {
    id: 'nectar_dew',
    tier: 2,
    symbol: '🧪',
    name: { vi: 'Cam Lộ Trường Sinh', en: 'Nectar of Dew' },
    desc: {
      vi: 'Nước Tinh Khiết nuôi dưỡng Rêu Sinh Mệnh tạo ra mật ngọt chữa lành, cường hóa mọi chốt lân cận.',
      en: 'Aqua nourishing Vitae into restorative nectar that awakens nearby crystal pegs.'
    },
    color: '#2dd4bf',
    glowColor: 'rgba(45, 212, 191, 0.68)',
    coreColor: '#f0fdfa',
    radius: 21,
    baseValue: 34,
    gravityScale: 0.9,
    bounciness: 0.82,
    specialEffect: 'energize_pegs'
  },
  wildfire_amber: {
    id: 'wildfire_amber',
    tier: 2,
    symbol: '💥',
    name: { vi: 'Hổ Phách Lửa Rừng', en: 'Wildfire Amber' },
    desc: {
      vi: 'Lửa Lưu Huỳnh đốt cháy Rêu Sinh Mệnh thành khối hổ phách nổ tung tia lửa vàng khi nảy.',
      en: 'Ignis kindling Vitae into volatile amber that bursts with golden shockwaves.'
    },
    color: '#f59e0b',
    glowColor: 'rgba(245, 158, 11, 0.72)',
    coreColor: '#fef3c7',
    radius: 21,
    baseValue: 36,
    gravityScale: 1.0,
    bounciness: 0.89,
    specialEffect: 'shockwave'
  },
  tideweaver_tears: {
    id: 'tideweaver_tears',
    tier: 2,
    symbol: '🌊',
    name: { vi: 'Nước Mắt Thủy Triều', en: 'Tideweaver Tears' },
    desc: {
      vi: 'Nước Tinh Khiết hòa quyện Bụi Ánh Trăng, tạo lực hút thủy triều gom thêm vàng từ không trung.',
      en: 'Aqua infused with Lunar Dust, pulling ambient gold particles with tidal magnetism.'
    },
    color: '#60a5fa',
    glowColor: 'rgba(96, 165, 250, 0.72)',
    coreColor: '#eff6ff',
    radius: 22,
    baseValue: 40,
    gravityScale: 0.85,
    bounciness: 0.85,
    specialEffect: 'magnet_gold'
  },
  eclipse_starfire: {
    id: 'eclipse_starfire',
    tier: 2,
    symbol: '✨',
    name: { vi: 'Lửa Nhật Thực', en: 'Eclipse Starfire' },
    desc: {
      vi: 'Lửa Lưu Huỳnh hợp nhất Bụi Ánh Trăng. Mỗi lần chạm chốt đều nhân 3 giá trị cộng hưởng!',
      en: 'Ignis and Lunar Dust merged into celestial flame. Triples every peg bounce reward!'
    },
    color: '#e879f9',
    glowColor: 'rgba(232, 121, 249, 0.72)',
    coreColor: '#fae8ff',
    radius: 22,
    baseValue: 44,
    gravityScale: 0.88,
    bounciness: 0.9,
    specialEffect: 'triple_peg'
  },
  dreamspore_spirit: {
    id: 'dreamspore_spirit',
    tier: 2,
    symbol: '🦋',
    name: { vi: 'Tinh Linh Mộng Mị', en: 'Dreamspore Spirit' },
    desc: {
      vi: 'Rêu Sinh Mệnh hấp thụ Bụi Ánh Trăng hóa thành đom đóm linh hồn bay lượn nhẹ nhàng.',
      en: 'Vitae and Lunar Dust awakening a luminescent sylph that glides effortlessly.'
    },
    color: '#a3e635',
    glowColor: 'rgba(163, 230, 53, 0.7)',
    coreColor: '#f7fee7',
    radius: 22,
    baseValue: 42,
    gravityScale: 0.65,
    bounciness: 0.88,
    specialEffect: 'floaty'
  },

  // --- TIER 3: THE MAGNUM OPUS ---
  philosopher_stone: {
    id: 'philosopher_stone',
    tier: 3,
    symbol: '👑',
    name: { vi: 'Đá Triết Gia', en: "Philosopher's Stone" },
    desc: {
      vi: 'Tuyệt tác tối thượng của Giả Kim Thuật! Kết tinh từ 2 Tinh Dầu Bậc 2 bất kỳ. Biến mọi va chạm thành mưa vàng!',
      en: 'The Magnum Opus of Alchemy! Synthesized from any two Tier-2 Elixirs. Transmutes every bounce into golden showers!'
    },
    color: '#fbbf24',
    glowColor: 'rgba(251, 191, 36, 0.9)',
    coreColor: '#fffbeb',
    radius: 27,
    baseValue: 110,
    gravityScale: 0.82,
    bounciness: 0.92,
    specialEffect: 'philosopher'
  }
};

export const RECIPES: RecipeDef[] = [
  {
    id: 'r_frost_pearl',
    ingA: 'aqua',
    ingB: 'aqua',
    result: 'frost_pearl',
    hint: { vi: 'Hai giọt nước lạnh ngưng tụ thành châu ngọc.', en: 'Two drops of pure water condense into a glacial pearl.' }
  },
  {
    id: 'r_solar_core',
    ingA: 'ignis',
    ingB: 'ignis',
    result: 'solar_core',
    hint: { vi: 'Lửa chồng thêm lửa tạo nên mặt trời thu nhỏ.', en: 'Ember upon ember ignites a miniature sun.' }
  },
  {
    id: 'r_mandrake_heart',
    ingA: 'vitae',
    ingB: 'vitae',
    result: 'mandrake_heart',
    hint: { vi: 'Hai mầm rêu quấn lấy nhau thành nhịp đập rừng sâu.', en: 'Twin moss spores intertwine into a living forest pulse.' }
  },
  {
    id: 'r_astral_prism',
    ingA: 'lunar',
    ingB: 'lunar',
    result: 'astral_prism',
    hint: { vi: 'Ánh trăng hội tụ thành lăng kính vĩnh cửu.', en: 'Moonlight converges into a crystalline prism.' }
  },
  {
    id: 'r_steam_vapor',
    ingA: 'aqua',
    ingB: 'ignis',
    result: 'steam_vapor',
    hint: { vi: 'Khi nước dập lửa, làn sương ấm bay lên.', en: 'When water meets flame, buoyant vapor ascends.' }
  },
  {
    id: 'r_nectar_dew',
    ingA: 'aqua',
    ingB: 'vitae',
    result: 'nectar_dew',
    hint: { vi: 'Nước tưới tắm mầm xanh chiết ra giọt cam lộ.', en: 'Pure water nourishing green moss yields restorative nectar.' }
  },
  {
    id: 'r_wildfire_amber',
    ingA: 'ignis',
    ingB: 'vitae',
    result: 'wildfire_amber',
    hint: { vi: 'Ngọn lửa nung chảy nhựa cây thành hổ phách nổ.', en: 'Sulfur flame searing living sap into volatile amber.' }
  },
  {
    id: 'r_tideweaver_tears',
    ingA: 'aqua',
    ingB: 'lunar',
    result: 'tideweaver_tears',
    hint: { vi: 'Ánh trăng dẫn lối cho thủy triều dâng trào.', en: 'Moonlight pulls the midnight tide.' }
  },
  {
    id: 'r_eclipse_starfire',
    ingA: 'ignis',
    ingB: 'lunar',
    result: 'eclipse_starfire',
    hint: { vi: 'Lửa đỏ che khuất ánh trăng trong khoảnh khắc nhật thực.', en: 'Crimson ember eclipsing silver moonlight.' }
  },
  {
    id: 'r_dreamspore_spirit',
    ingA: 'vitae',
    ingB: 'lunar',
    result: 'dreamspore_spirit',
    hint: { vi: 'Bào tử rừng đêm thức tỉnh dưới bụi sao.', en: 'Forest spores awakening beneath falling stardust.' }
  },
  {
    id: 'r_philosopher_stone',
    ingA: 'steam_vapor',
    ingB: 'wildfire_amber',
    result: 'philosopher_stone',
    hint: { vi: 'Hợp nhất bất kỳ 2 Tinh Dầu Bậc 2 nào để rèn Đá Triết Gia!', en: 'Fuse ANY two Tier-2 Elixirs to forge the Philosopher\'s Stone!' }
  }
];

export function findSynthesisResult(a: ElementId, b: ElementId): { result: ElementId; recipeId: string } | null {
  const defA = ELEMENTS[a];
  const defB = ELEMENTS[b];

  // Any two Tier 2 elements fuse into Philosopher's Stone!
  if (defA.tier === 2 && defB.tier === 2) {
    return { result: 'philosopher_stone', recipeId: 'r_philosopher_stone' };
  }

  for (const r of RECIPES) {
    if ((r.ingA === a && r.ingB === b) || (r.ingA === b && r.ingB === a)) {
      return { result: r.result, recipeId: r.id };
    }
  }
  return null;
}

export const BASE_ELEMENTS: ElementId[] = ['aqua', 'ignis', 'vitae', 'lunar'];
export const ALL_ELEMENT_IDS: ElementId[] = Object.keys(ELEMENTS) as ElementId[];

