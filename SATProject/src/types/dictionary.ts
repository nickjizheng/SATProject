export interface DictionaryResponse {
  meta: {
    id: string;
    uuid: string;
    sort: string;
    src: string;
    section: string;
    stems: string[];
    offensive: boolean;
  };
  hwi: {
    hw: string;
    prs: Array<{
      mw: string;
      sound?: {
        audio: string;
        ref: string;
        stat: string;
      };
    }>;
  };
  fl: string;
  lbs?: string[];
  def: any[];
  uros?: Array<{
    ure: string;
    fl: string;
  }>;
  dros?: Array<{
    drp: string;
    def: any[];
  }>;
  et?: Array<[string, string]>;
  date: string;
  shortdef: string[];
}