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
    /**フォルダ */
    folder: string;
    /**時刻 */
    time: Date;
  }

  export function registMock(axiosMockBuilder: AxiosAdapterBuilder){
    const froms = [
      "山田太郎",
      "花山薫",
      "amazon"
    ]
    const data: Resource[] = new Array(100).fill({}).map((_, index) => {
      const datum = {
        id: `${index + 1}`,
        title: `タイトル${index + 1}`,
        from: froms[index % froms.length],
        contents: "今日はいい天気です。\n明日も張れるでしょう。",
        folder: index %2 === 0 ? "受信トレイ" : "迷惑メール",
        time: new Date(),
      };
      return datum;
    });
    axiosMockBuilder.append(createMultiRestApiMock("DataLinkEnterprise", {
      data: data,
      rootPath: /messages/,
      supportedTypes: ["search", "get", "put"],
      search: (data, url) => {
        
        const keyword = url.searchParams.get("keyword");
        const folder = url.searchParams.get("folder") ?? "受信トレイ";
        const filtered = data.filter(item => 
          (keyword == null || keyword.trim().length === 0 || item.title.indexOf(keyword) >= 0 || item.from.indexOf(keyword) >= 0)//キーワード検索
          && (item.folder === folder)//フォルダ検索
        );
        return filtered;
      },
      getKey: (data)=> {
        return data.id;
      },
      find: ((data, url, request) => {
        const pathNames = url.pathname.split("/");
        const id = pathNames[pathNames.length - 1];
        const index = data.findIndex(item => item.id === id);
        return index >= 0 ? index : undefined;
      }),
      createData: (requestBody, type, currentData) => {
        if(currentData == null)throw Error("");
        return {
          id: currentData.id,
          title: requestBody.title,
          from: requestBody.from,
          contents: requestBody.contents,
          folder: requestBody.folder,
          time: currentData.time
        };
      },
      allowCreateWhenPut: false,
      
    }));
  }
}