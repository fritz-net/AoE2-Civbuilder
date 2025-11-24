/**
 * Composable for civilization-related data and constants
 */

export const colours = [
  [0, 0, 0],
  [255, 255, 255],
  [217, 0, 0],
  [0, 173, 54],
  [249, 233, 13],
  [0, 0, 128],
  [255, 153, 51],
  [0, 162, 221],
  [84, 14, 125],
  [224, 58, 213],
  [73, 235, 173],
  [66, 30, 1],
  [92, 92, 92],
  [255, 171, 202],
  [171, 207, 255],
]

export const flagCategories = [
  'Color 1',
  'Color 2',
  'Color 3',
  'Color 4',
  'Color 5',
  'Division',
  'Overlay',
  'Symbol',
]

export const paletteSizes = [15, 15, 15, 15, 15, 12, 12, 84]

export const architectures = [
  'Central European',
  'Western European',
  'East Asian',
  'Middle Eastern',
  'Mesoamerican',
  'Mediterranean',
  'Indian',
  'Eastern European',
  'African',
  'Southeast Asian',
  'Central Asian',
]

export const languages = [
  'British Language',
  'French Language',
  'Gothic Language',
  'Teuton Language',
  'Japanese Language',
  'Chinese Language',
  'Byzantine Language',
  'Persian Language',
  'Saracen Language',
  'Turk Language',
  'Viking Language',
  'Mongol Language',
  'Celtic Language',
  'Spanish Language',
  'Aztec Language',
  'Mayan Language',
  'Hunnic Language',
  'Korean Language',
  'Italian Language',
  'Indian Language',
  'Incan Language',
  'Magyar Language',
  'Slavic Language',
  'Portuguese Language',
  'Ethiopian Language',
  'Malian Language',
  'Berber Language',
  'Khmer Language',
  'Malay Language',
  'Burmese Language',
  'Vietnamese Language',
  'Bulgarian Language',
  'Tatar Language',
  'Cuman Language',
  'Lithuanian Language',
  'Burgundian Language',
  'Sicilian Language',
  'Polish Language',
  'Bohemian Language',
  'Dravidian Language',
  'Bengali Language',
  'Gurjaran Language',
  'Roman Language',
]

export const wonders = [
  'Chichester Cathedral (Britons)',
  'Chartres Cathedral (Franks)',
  'Mausoleum of Theodoric (Goths)',
  'Maria Laach Abbey (Teutons)',
  'Great Buddha Hall (Japanese)',
  'Temple of Heaven (Chinese)',
  'Hagia Sophia (Byzantines)',
  'Taq Kasra (Persians)',
  'Great Mosque of Samarra (Saracens)',
  'Selimiye Mosque (Turks)',
  'Borgund Stave Church (Vikings)',
  'Great Tent of Genghis Khan (Mongols)',
  'Rock of Cashel (Celts)',
  'Torre del Oro (Spanish)',
  'Temple Mayor (Aztecs)',
  'Temple of the Great Jaguar (Mayans)',
  'Arch of Constantine (Huns)',
  'Pagoda of Hwangnyong Temple (Koreans)',
  'Genoa Cathedral (Italians)',
  "Humayun's Tomb (Hindustanis)",
  'Temple of the Sun (Inca)',
  'Corvin Castle (Magyars)',
  'Kizhi Pogost (Slavs)',
  'Belem Tower (Portuguese)',
  'Biete Amanuel (Ethiopians)',
  'Great Mosque of Djenne (Malians)',
  'Hassan Tower (Berbers)',
  'Bakan of Angkor Wat (Khmer)',
  'Kalasan Temple (Malay)',
  'Schwezigon Pagoda (Burmese)',
  'But Thap Temple (Vietnamese)',
  'Round Church (Bulgarians)',
  'Ulugh Beg Observatory (Tatars)',
  'Sarkel Fortress (Cumans)',
  'Trakai Island Castle (Lithuanians)',
  'Brussels Town Hall (Burgundians)',
  'Monreale Cathedral (Sicilians)',
  'Wawel Cathedral (Poles)',
  'Powder Tower (Bohemians)',
  'Brihadisvara Temple (Dravidians)',
  'Somapura Mahavihara (Bengalis)',
  'Somnath Temple (Gurjaras)',
  'Colosseum (Romans)',
  'Etchmiadzin Cathedral (Armenians)',
  'Svetitskhoveli Cathedral (Georgians)',
  'Wuhou Memorial (Shu)',
  "Jing'an Temple (Wu)",
  'Songyue Pagoda (Wei)',
  'Yinshan Pagoda Forest (Jurchens)',
  'Pagoda of Fogong Temple (Khitans)',
]

export interface CivConfig {
  alias: string
  flag_palette: number[]
  tree: number[][]
  bonuses: (number | number[])[][]
  architecture: number
  language: number
  wonder: number
  castle: number
  customFlag: boolean
  customFlagData: string
  description: string
}

export function createDefaultCiv(): CivConfig {
  return {
    alias: '',
    flag_palette: [3, 4, 5, 6, 7, 3, 3, 3],
    tree: [
      [13, 17, 21, 74, 545, 539, 331, 125, 83, 128, 440],
      [12, 45, 49, 50, 68, 70, 72, 79, 82, 84, 87, 101, 103, 104, 109, 199, 209, 276, 562, 584, 598, 621, 792],
      [22, 101, 102, 103, 408],
    ],
    bonuses: [[], [], [], [], []],
    architecture: 1,
    language: 0,
    wonder: 0,
    castle: 0,
    customFlag: false,
    customFlagData: '',
    description: '',
  }
}

export function useCivData() {
  return {
    colours,
    flagCategories,
    paletteSizes,
    architectures,
    languages,
    wonders,
    createDefaultCiv,
  }
}
