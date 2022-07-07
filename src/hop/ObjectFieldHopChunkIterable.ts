import { Paths } from "../paths.js";
import { BaseChunkIterable, ChunkIterable } from "../ChunkIterable.js";
import followPath from "../followPath.js";

export default class ObjectFieldHopChunkIterable<
  TIn,
  TOut
> extends BaseChunkIterable<TOut> {
  constructor(
    private readonly source: ChunkIterable<TIn>,
    private readonly path: Paths<TIn>
  ) {
    super();
  }

  async *[Symbol.asyncIterator](): AsyncIterator<readonly TOut[]> {
    for await (const chunk of this.source) {
      yield chunk.flatMap((i) => followPath(i, this.path) || []);
    }
  }
}
