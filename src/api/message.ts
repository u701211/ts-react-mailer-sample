import { AxiosAdapterBuilder } from '../lib/axiosMock';
import { createMultiRestApiMock } from '../lib/axiosRestApiMock';

export namespace Message{
  export interface Resource{
    /**識別子 */
    id: string;
    /**メールの件名 */
    title: string;
    /**送信元 */
    from: string;
    /**本文 */
    contents: string;
    /**時刻 */
    time: Date;
  }

  export function registMock(axiosMockBuilder: AxiosAdapterBuilder){
    const froms = [
      "山田太郎",
      "花山薫",
      "amazon"
    ]
    const data: Resource[] = new Array(2000).fill({}).map((_, index) => {
      const datum = {
        id: `${index + 1}`,
        title: `タイトル${index + 1}`,
        from: froms[index % froms.length],
        contents: "今日はいい天気です。\n明日も張れるでしょう。",
        time: new Date(),
      };
      return datum;
    });
    axiosMockBuilder.append(createMultiRestApiMock("DataLinkEnterprise", {
      data: data,
      rootPath: /messages/,
      supportedTypes: ["search", "get"],
      search: (data, url) => {
        
        const keyword = url.searchParams.get("keyword");
        const filtered = data.filter(item => keyword == null || keyword.trim().length === 0 || item.title.indexOf(keyword) >= 0 || item.from.indexOf(keyword) >= 0);
        return filtered;
      },
      getKey: (data)=> {
        return data.id;
      }
      
    }));
  }
}