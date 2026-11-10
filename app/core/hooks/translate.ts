// Type Dutch adaptation: modified 2026-11-10. Upstream: zyronon/TypeWords, GPL-3.0.
import { Toast } from '@/base'
import type { Article, Sentence } from '../types'
import { TranslateEngine } from '../types'

export function getSentenceAllTranslateText(article: Article) {
  return article.sections
    .map(v =>
      v
        .map(s => s.translate.trim())
        .filter(v => v)
        .join(' \n')
    )
    .filter(v => v)
    .join(' \n\n')
}

export function getSentenceAllText(article: Article) {
  return article.sections
    .map(v =>
      v
        .map(s => s.text)
        .filter(v => v)
        .join('\n')
    )
    .filter(v => v)
    .join('\n\n')
}

/***
 * @desc
 * @param article 文章实体
 * @param translateEngine 翻译引擎
 * @param allShow 是否翻译完所有之后才显示
 * @param progressCb 进度回调
 * */
export async function getNetworkTranslate(
  _article: Article,
  _translateEngine: TranslateEngine,
  _allShow = false,
  _progressCb?: (value: number) => void
) {
  Toast.info('请在文章编辑器中填写中文译文；荷兰语版暂不提供在线自动翻译。')
  return false
}
