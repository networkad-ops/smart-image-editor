export interface TextElement {
  id: string;
  type: 'fixed' | 'custom';
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize: number;
  fontFamily: string;
  fontWeight: number;
  color: string;
  editable: {
    position: boolean;
    size: boolean;
    color: boolean;
  };
} 