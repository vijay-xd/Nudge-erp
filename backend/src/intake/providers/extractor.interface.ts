export interface ExtractedItem {
  rawSku: string;
  rawName: string;
  quantity: number;
  unitPrice: number;
  barcode?: string;
}

export interface ExtractionResult {
  externalOrderId: string;
  customerName: string;
  channelName: string;
  orderDate: string;
  expectedDelivery?: string;
  items: ExtractedItem[];
  rawText?: string;
  confidenceScore: number;
  metadata?: Record<string, any>;
}

export interface DocumentExtractor {
  extract(fileBuffer: Buffer, fileName: string): Promise<ExtractionResult>;
}
