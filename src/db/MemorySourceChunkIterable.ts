import { BaseChunkIterable } from "../ChunkIterable.js";
import { memoryDb, MemoryReadQuery, ModelType } from "./MemoryDb.js";

export default class MemorySourceChunkIterable<
  T extends ModelType
> extends BaseChunkIterable<T> {
  constructor(private query: MemoryReadQuery) {
    super();
  }

  async *[Symbol.asyncIterator](): AsyncIterator<readonly T[]> {
    yield await memoryDb.query<T>(this.query);
  }
}
