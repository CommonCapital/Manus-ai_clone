import {Document} from "@langchain/core/documents"
import {RecursiveCharacterTextSplitter} from "@langchain/textsplitters"
import { BM25Retriever } from "@langchain/community/retrievers/bm25";
import { extractRelevantDocument } from "./bm25Extractor";

export const formatDocumentAsString = (documents: Document[]) => {
return documents.map((doc) => doc?.pageContent).join("\n\n")
};
export  async function bm25Retriever(document: string, query:string) {
    const newDoc = new Document({
        pageContent: document,
        metadata: {
title: "user     :"+"DAILY_LOG_ARCHIVE"
        }
    })

    const docSplitter = new RecursiveCharacterTextSplitter({chunkSize: 1000, chunkOverlap: 200 }); 
const splitDocs = await docSplitter.splitDocuments([newDoc]);

const retriever = BM25Retriever.fromDocuments([...splitDocs], {k:4});


const data = await retriever.invoke(query);
const docToString = formatDocumentAsString(data)
const filteredData=await extractRelevantDocument(query,docToString)
return docToString
}