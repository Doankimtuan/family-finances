import { InvestmentAssetClass } from "./investment-constants";
export type InvestmentUxType =
  (typeof InvestmentAssetClass)[keyof typeof InvestmentAssetClass];
export type InvestmentUxConfig = {
  assetClass: InvestmentUxType;
  title: string;
  description: string;
  instrumentLabel: string;
  quantityLabel: string;
  priceLabel: string;
  valuationPriceLabel: string;
  disposalPriceLabel: string;
  unitSuffix: string;
  priceCurrency: string;
  providerHint: string;
  purchaseAction: string;
  disposalAction: string;
  incomeLabel: string;
  unitLabel?: string;
};
export const INVESTMENT_UX_REGISTRY: Record<
  InvestmentUxType,
  InvestmentUxConfig
> = {
  crypto: {
    assetClass: InvestmentAssetClass.CRYPTO,
    title: "Crypto",
    description: "Theo dõi tài sản Spot và giá vốn.",
    instrumentLabel: "Tài sản",
    quantityLabel: "Số lượng",
    priceLabel: "Giá mua",
    valuationPriceLabel: "Giá hiện tại / BTC",
    disposalPriceLabel: "Giá bán / BTC",
    unitSuffix: "BTC",
    priceCurrency: "USDT",
    providerHint: "Sàn hoặc nhà cung cấp",
    purchaseAction: "Mua thêm",
    disposalAction: "Bán",
    incomeLabel: "Cổ tức",
  },
  stock: {
    assetClass: InvestmentAssetClass.STOCK,
    title: "Chứng khoán",
    description: "Cổ phiếu, ETF và tài sản giao dịch theo số lượng.",
    instrumentLabel: "Mã / tài sản",
    quantityLabel: "Số lượng",
    priceLabel: "Giá mua mỗi đơn vị",
    valuationPriceLabel: "Giá hiện tại / cổ phiếu",
    disposalPriceLabel: "Giá bán / cổ phiếu",
    unitSuffix: "cổ phiếu",
    priceCurrency: "VND",
    providerHint: "Nhà cung cấp / nơi lưu ký",
    purchaseAction: "Mua thêm",
    disposalAction: "Bán",
    incomeLabel: "Cổ tức",
  },
  fund: {
    assetClass: InvestmentAssetClass.FUND,
    title: "Quỹ",
    description: "Theo dõi số tiền đầu tư, NAV và chứng chỉ quỹ.",
    instrumentLabel: "Quỹ",
    quantityLabel: "Số CCQ",
    priceLabel: "NAV / CCQ",
    valuationPriceLabel: "NAV hiện tại / CCQ",
    disposalPriceLabel: "NAV / giá thực hiện mỗi CCQ",
    unitSuffix: "CCQ",
    priceCurrency: "VND",
    providerHint: "Nền tảng / nhà cung cấp",
    purchaseAction: "Đầu tư thêm",
    disposalAction: "Rút khỏi quỹ",
    incomeLabel: "Phân phối",
  },
  gold: {
    assetClass: InvestmentAssetClass.GOLD,
    title: "Vàng",
    description: "Theo dõi trọng lượng, giá mua và giá mua lại.",
    instrumentLabel: "Loại vàng",
    quantityLabel: "Trọng lượng / số lượng",
    priceLabel: "Giá bạn mua",
    valuationPriceLabel: "Giá mua lại hiện tại / chỉ",
    disposalPriceLabel: "Giá bán thực tế / chỉ",
    unitSuffix: "chỉ",
    priceCurrency: "VND",
    providerHint: "Nhà cung cấp",
    purchaseAction: "Mua thêm",
    disposalAction: "Bán",
    incomeLabel: "Thu nhập",
    unitLabel: "Đơn vị",
  },
  bond: {
    assetClass: InvestmentAssetClass.BOND,
    title: "Khác",
    description: "Theo dõi tài sản thủ công hoặc sản phẩm khác.",
    instrumentLabel: "Tên tài sản",
    quantityLabel: "Số lượng",
    priceLabel: "Giá trị hiện tại",
    valuationPriceLabel: "Giá trị hiện tại",
    disposalPriceLabel: "Giá trị điều chỉnh",
    unitSuffix: "đơn vị",
    priceCurrency: "VND",
    providerHint: "Nơi lưu giữ",
    purchaseAction: "Ghi nhận",
    disposalAction: "Điều chỉnh",
    incomeLabel: "Thu nhập",
  },
};
export const investmentUxConfig = (assetClass: InvestmentUxType) =>
  INVESTMENT_UX_REGISTRY[assetClass];
export const investmentEntryModeLabels = {
  historical: "Tôi đã sở hữu từ trước",
  purchase: "Tôi mua / đầu tư ngay bây giờ",
} as const;
