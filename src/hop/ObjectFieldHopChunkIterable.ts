import { BaseChunkIterable, ChunkIterable } from "../ChunkIterable.js";

export default class ObjectFieldHopChunkIterable<
  TIn,
  TOut
> extends BaseChunkIterable<TOut> {
  constructor(
    private readonly source: ChunkIterable<TIn>,
    private readonly fn: (x: TIn) => TOut
  ) {
    super();
  }

  async *[Symbol.asyncIterator](): AsyncIterator<readonly TOut[]> {
    for await (const chunk of this.source) {
      yield chunk.flatMap((i) => this.fn(i));
    }
  }
}
