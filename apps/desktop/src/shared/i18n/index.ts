import { app } from './messages/app'
import { settings } from './messages/settings'
import { vrc } from './messages/vrc'
import { vts } from './messages/vts'
import { warudo } from './messages/warudo'
import { widget } from './messages/widget'

export const LANGUAGES = ['en', 'th'] as const

export type Language = (typeof LANGUAGES)[number]

export const LANGUAGE_NAMES: Record<Language, string> = {
  en: 'English',
  th: 'ไทย',
}

export const isLanguage = (value: unknown): value is Language =>
  LANGUAGES.some(language => language === value)

export const en = {
  app: app.en,
  widget: widget.en,
  vrc: vrc.en,
  vts: vts.en,
  warudo: warudo.en,
  settings: settings.en,
}

export type Messages = typeof en

const th: Messages = {
  app: app.th,
  widget: widget.th,
  vrc: vrc.th,
  vts: vts.th,
  warudo: warudo.th,
  settings: settings.th,
}

export const MESSAGES: Record<Language, Messages> = { en, th }
