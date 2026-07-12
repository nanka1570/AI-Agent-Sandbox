// NASDAQ-100 構成銘柄（2026-07 時点、stockanalysis.com で確認）
// Alphabet が 2 クラス（GOOGL/GOOG）あるため 100 社 101 銘柄
// 構成変更は年数回のみのため静的リストで保持する

export interface StockInfo {
  ticker: string;
  name: string;
  sector: string;
}

export const SECTORS = [
  "情報技術",
  "コミュニケーション・サービス",
  "一般消費財",
  "生活必需品",
  "ヘルスケア",
  "資本財・サービス",
  "公益事業",
  "エネルギー",
  "素材",
  "金融",
  "不動産",
] as const;

// 逆行高（地合いが悪い日の上昇）判定用のベンチマーク
// NASDAQ-100 連動 ETF。ダッシュボードの銘柄一覧には表示しない
export const BENCHMARK: StockInfo = {
  ticker: "QQQ",
  name: "Invesco QQQ（ベンチマーク）",
  sector: "ベンチマーク",
};

export const NASDAQ100: StockInfo[] = [
  // 情報技術
  { ticker: "NVDA", name: "NVIDIA", sector: "情報技術" },
  { ticker: "AAPL", name: "Apple", sector: "情報技術" },
  { ticker: "MSFT", name: "Microsoft", sector: "情報技術" },
  { ticker: "AVGO", name: "Broadcom", sector: "情報技術" },
  { ticker: "MU", name: "Micron Technology", sector: "情報技術" },
  { ticker: "AMD", name: "Advanced Micro Devices", sector: "情報技術" },
  { ticker: "ASML", name: "ASML Holding", sector: "情報技術" },
  { ticker: "INTC", name: "Intel", sector: "情報技術" },
  { ticker: "AMAT", name: "Applied Materials", sector: "情報技術" },
  { ticker: "LRCX", name: "Lam Research", sector: "情報技術" },
  { ticker: "CSCO", name: "Cisco Systems", sector: "情報技術" },
  { ticker: "ARM", name: "Arm Holdings", sector: "情報技術" },
  { ticker: "KLAC", name: "KLA", sector: "情報技術" },
  { ticker: "PLTR", name: "Palantir Technologies", sector: "情報技術" },
  { ticker: "PANW", name: "Palo Alto Networks", sector: "情報技術" },
  { ticker: "TXN", name: "Texas Instruments", sector: "情報技術" },
  { ticker: "MRVL", name: "Marvell Technology", sector: "情報技術" },
  { ticker: "STX", name: "Seagate Technology", sector: "情報技術" },
  { ticker: "WDC", name: "Western Digital", sector: "情報技術" },
  { ticker: "CRWD", name: "CrowdStrike", sector: "情報技術" },
  { ticker: "QCOM", name: "Qualcomm", sector: "情報技術" },
  { ticker: "APP", name: "AppLovin", sector: "情報技術" },
  { ticker: "ADI", name: "Analog Devices", sector: "情報技術" },
  { ticker: "SHOP", name: "Shopify", sector: "情報技術" },
  { ticker: "FTNT", name: "Fortinet", sector: "情報技術" },
  { ticker: "CDNS", name: "Cadence Design Systems", sector: "情報技術" },
  { ticker: "SNPS", name: "Synopsys", sector: "情報技術" },
  { ticker: "ADBE", name: "Adobe", sector: "情報技術" },
  { ticker: "INTU", name: "Intuit", sector: "情報技術" },
  { ticker: "NXPI", name: "NXP Semiconductors", sector: "情報技術" },
  { ticker: "MPWR", name: "Monolithic Power Systems", sector: "情報技術" },
  { ticker: "MCHP", name: "Microchip Technology", sector: "情報技術" },
  { ticker: "ADSK", name: "Autodesk", sector: "情報技術" },
  { ticker: "ROP", name: "Roper Technologies", sector: "情報技術" },
  { ticker: "WDAY", name: "Workday", sector: "情報技術" },
  { ticker: "ZS", name: "Zscaler", sector: "情報技術" },
  { ticker: "TEAM", name: "Atlassian", sector: "情報技術" },
  { ticker: "CTSH", name: "Cognizant", sector: "情報技術" },
  { ticker: "MSTR", name: "Strategy", sector: "情報技術" },
  { ticker: "DDOG", name: "Datadog", sector: "情報技術" },
  // コミュニケーション・サービス
  { ticker: "GOOGL", name: "Alphabet (Class A)", sector: "コミュニケーション・サービス" },
  { ticker: "GOOG", name: "Alphabet (Class C)", sector: "コミュニケーション・サービス" },
  { ticker: "META", name: "Meta Platforms", sector: "コミュニケーション・サービス" },
  { ticker: "NFLX", name: "Netflix", sector: "コミュニケーション・サービス" },
  { ticker: "TMUS", name: "T-Mobile US", sector: "コミュニケーション・サービス" },
  { ticker: "CMCSA", name: "Comcast", sector: "コミュニケーション・サービス" },
  { ticker: "WBD", name: "Warner Bros. Discovery", sector: "コミュニケーション・サービス" },
  { ticker: "EA", name: "Electronic Arts", sector: "コミュニケーション・サービス" },
  { ticker: "TTWO", name: "Take-Two Interactive", sector: "コミュニケーション・サービス" },
  { ticker: "CHTR", name: "Charter Communications", sector: "コミュニケーション・サービス" },
  // 一般消費財
  { ticker: "AMZN", name: "Amazon.com", sector: "一般消費財" },
  { ticker: "TSLA", name: "Tesla", sector: "一般消費財" },
  { ticker: "SBUX", name: "Starbucks", sector: "一般消費財" },
  { ticker: "PDD", name: "PDD Holdings", sector: "一般消費財" },
  { ticker: "BKNG", name: "Booking Holdings", sector: "一般消費財" },
  { ticker: "MAR", name: "Marriott International", sector: "一般消費財" },
  { ticker: "ORLY", name: "O'Reilly Automotive", sector: "一般消費財" },
  { ticker: "ROST", name: "Ross Stores", sector: "一般消費財" },
  { ticker: "ABNB", name: "Airbnb", sector: "一般消費財" },
  { ticker: "DASH", name: "DoorDash", sector: "一般消費財" },
  { ticker: "MELI", name: "MercadoLibre", sector: "一般消費財" },
  // 生活必需品
  { ticker: "WMT", name: "Walmart", sector: "生活必需品" },
  { ticker: "COST", name: "Costco Wholesale", sector: "生活必需品" },
  { ticker: "PEP", name: "PepsiCo", sector: "生活必需品" },
  { ticker: "MNST", name: "Monster Beverage", sector: "生活必需品" },
  { ticker: "MDLZ", name: "Mondelez International", sector: "生活必需品" },
  { ticker: "CCEP", name: "Coca-Cola Europacific Partners", sector: "生活必需品" },
  { ticker: "KDP", name: "Keurig Dr Pepper", sector: "生活必需品" },
  { ticker: "KHC", name: "Kraft Heinz", sector: "生活必需品" },
  // ヘルスケア
  { ticker: "AMGN", name: "Amgen", sector: "ヘルスケア" },
  { ticker: "GILD", name: "Gilead Sciences", sector: "ヘルスケア" },
  { ticker: "ISRG", name: "Intuitive Surgical", sector: "ヘルスケア" },
  { ticker: "VRTX", name: "Vertex Pharmaceuticals", sector: "ヘルスケア" },
  { ticker: "REGN", name: "Regeneron Pharmaceuticals", sector: "ヘルスケア" },
  { ticker: "IDXX", name: "IDEXX Laboratories", sector: "ヘルスケア" },
  { ticker: "ALNY", name: "Alnylam Pharmaceuticals", sector: "ヘルスケア" },
  { ticker: "GEHC", name: "GE HealthCare", sector: "ヘルスケア" },
  { ticker: "DXCM", name: "DexCom", sector: "ヘルスケア" },
  { ticker: "INSM", name: "Insmed", sector: "ヘルスケア" },
  // 資本財・サービス
  { ticker: "ADP", name: "Automatic Data Processing", sector: "資本財・サービス" },
  { ticker: "CSX", name: "CSX", sector: "資本財・サービス" },
  { ticker: "HON", name: "Honeywell International", sector: "資本財・サービス" },
  { ticker: "CTAS", name: "Cintas", sector: "資本財・サービス" },
  { ticker: "PCAR", name: "PACCAR", sector: "資本財・サービス" },
  { ticker: "FAST", name: "Fastenal", sector: "資本財・サービス" },
  { ticker: "ODFL", name: "Old Dominion Freight Line", sector: "資本財・サービス" },
  { ticker: "PAYX", name: "Paychex", sector: "資本財・サービス" },
  { ticker: "CPRT", name: "Copart", sector: "資本財・サービス" },
  { ticker: "VRSK", name: "Verisk Analytics", sector: "資本財・サービス" },
  { ticker: "AXON", name: "Axon Enterprise", sector: "資本財・サービス" },
  { ticker: "TRI", name: "Thomson Reuters", sector: "資本財・サービス" },
  { ticker: "FER", name: "Ferrovial", sector: "資本財・サービス" },
  // 公益事業
  { ticker: "CEG", name: "Constellation Energy", sector: "公益事業" },
  { ticker: "AEP", name: "American Electric Power", sector: "公益事業" },
  { ticker: "XEL", name: "Xcel Energy", sector: "公益事業" },
  { ticker: "EXC", name: "Exelon", sector: "公益事業" },
  // エネルギー
  { ticker: "BKR", name: "Baker Hughes", sector: "エネルギー" },
  { ticker: "FANG", name: "Diamondback Energy", sector: "エネルギー" },
  // 素材
  { ticker: "LIN", name: "Linde", sector: "素材" },
  // 金融
  { ticker: "PYPL", name: "PayPal", sector: "金融" },
  // 不動産
  { ticker: "CSGP", name: "CoStar Group", sector: "不動産" },
];
