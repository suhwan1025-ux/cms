/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */

import { ClassicEditor as ClassicEditorBase } from '@ckeditor/ckeditor5-editor-classic';

// 기본 플러그인
import { Essentials } from '@ckeditor/ckeditor5-essentials';
import { Paragraph } from '@ckeditor/ckeditor5-paragraph';
import { Bold, Italic, Underline, Strikethrough } from '@ckeditor/ckeditor5-basic-styles';
import { Heading } from '@ckeditor/ckeditor5-heading';
import { List, ListProperties } from '@ckeditor/ckeditor5-list';
import { Link } from '@ckeditor/ckeditor5-link';

// 정렬 및 폰트 플러그인 (명시적으로 설치됨)
import { Alignment } from '@ckeditor/ckeditor5-alignment';
import { FontSize, FontFamily, FontColor, FontBackgroundColor } from '@ckeditor/ckeditor5-font';

// Table 전체 - 가장 강력한 표 기능
import { Table, TableToolbar, TableProperties, TableCellProperties, TableColumnResize } from '@ckeditor/ckeditor5-table';

// 기타 유용한 기능
import { PasteFromOffice } from '@ckeditor/ckeditor5-paste-from-office';
import { Typing } from '@ckeditor/ckeditor5-typing';

export default class ClassicEditor extends ClassicEditorBase {}

ClassicEditor.builtinPlugins = [
  Essentials,
  Paragraph,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Heading,
  List,
  ListProperties,
  Link,
  Alignment,
  FontSize,
  FontFamily,
  FontColor,
  FontBackgroundColor,
  Table,
  TableToolbar,
  TableProperties,
  TableCellProperties,
  TableColumnResize,
  PasteFromOffice,
  Typing
];

ClassicEditor.defaultConfig = {
  licenseKey: 'GPL', // GPL 라이선스 사용
  toolbar: {
    shouldNotGroupWhenFull: true, // 툴바 그룹화 비활성화
    items: [
      'heading',
      '|',
      'fontSize',
      'fontFamily',
      'fontColor',
      'fontBackgroundColor',
      '|',
      'bold',
      'italic',
      'underline',
      'strikethrough',
      '|',
      'alignment',
      '|',
      'link',
      '|',
      'bulletedList',
      'numberedList',
      '|',
      'insertTable',
      '|',
      'undo',
      'redo'
    ]
  },
  fontSize: {
    options: [
      9,
      10,
      11,
      12,
      14,
      16,
      18,
      20,
      22,
      24,
      26,
      28,
      36,
      48,
      72
    ],
    supportAllValues: true
  },
  fontFamily: {
    options: [
      'default',
      '맑은 고딕, Malgun Gothic',
      '굴림, Gulim',
      '돋움, Dotum',
      '바탕, Batang',
      'Arial, sans-serif',
      'Times New Roman, serif',
      'Courier New, monospace'
    ],
    supportAllValues: true
  },
  fontColor: {
    columns: 5,
    colors: [
      { color: 'hsl(0, 0%, 0%)', label: '검정' },
      { color: 'hsl(0, 0%, 30%)', label: '어두운 회색' },
      { color: 'hsl(0, 0%, 60%)', label: '회색' },
      { color: 'hsl(0, 0%, 90%)', label: '밝은 회색' },
      { color: 'hsl(0, 0%, 100%)', label: '흰색', hasBorder: true },
      { color: 'hsl(0, 75%, 60%)', label: '빨강' },
      { color: 'hsl(30, 75%, 60%)', label: '주황' },
      { color: 'hsl(60, 75%, 60%)', label: '노랑' },
      { color: 'hsl(120, 75%, 60%)', label: '초록' },
      { color: 'hsl(240, 75%, 60%)', label: '파랑' }
    ]
  },
  fontBackgroundColor: {
    columns: 5,
    colors: [
      { color: 'hsl(0, 0%, 100%)', label: '흰색', hasBorder: true },
      { color: 'hsl(0, 0%, 90%)', label: '밝은 회색' },
      { color: 'hsl(60, 75%, 90%)', label: '연한 노랑' },
      { color: 'hsl(30, 75%, 90%)', label: '연한 주황' },
      { color: 'hsl(0, 75%, 90%)', label: '연한 빨강' },
      { color: 'hsl(120, 75%, 90%)', label: '연한 초록' },
      { color: 'hsl(240, 75%, 90%)', label: '연한 파랑' }
    ]
  },
  table: {
    contentToolbar: [
      'tableColumn',
      'tableRow',
      'mergeTableCells',
      'splitTableCell',
      'tableCellProperties',
      'tableProperties'
    ],
    tableProperties: {
      borderColors: [
        { color: 'hsl(0, 0%, 0%)', label: '검정' },
        { color: 'hsl(0, 0%, 30%)', label: '어두운 회색' },
        { color: 'hsl(0, 0%, 60%)', label: '회색' },
        { color: 'hsl(0, 0%, 90%)', label: '밝은 회색' },
        { color: 'hsl(0, 0%, 100%)', label: '흰색', hasBorder: true }
      ],
      backgroundColors: [
        { color: 'hsl(0, 0%, 100%)', label: '흰색', hasBorder: true },
        { color: 'hsl(0, 0%, 90%)', label: '밝은 회색' },
        { color: 'hsl(60, 75%, 60%)', label: '노랑' },
        { color: 'hsl(30, 75%, 60%)', label: '주황' },
        { color: 'hsl(0, 75%, 60%)', label: '빨강' }
      ]
    },
    tableCellProperties: {
      borderColors: [
        { color: 'hsl(0, 0%, 0%)', label: '검정' },
        { color: 'hsl(0, 0%, 30%)', label: '어두운 회색' },
        { color: 'hsl(0, 0%, 60%)', label: '회색' },
        { color: 'hsl(0, 0%, 90%)', label: '밝은 회색' },
        { color: 'hsl(0, 0%, 100%)', label: '흰색', hasBorder: true }
      ],
      backgroundColors: [
        { color: 'hsl(0, 0%, 100%)', label: '흰색', hasBorder: true },
        { color: 'hsl(0, 0%, 90%)', label: '밝은 회색' },
        { color: 'hsl(60, 75%, 60%)', label: '노랑' },
        { color: 'hsl(30, 75%, 60%)', label: '주황' },
        { color: 'hsl(0, 75%, 60%)', label: '빨강' }
      ]
    }
  },
  heading: {
    options: [
      { model: 'paragraph', title: '본문', class: 'ck-heading_paragraph' },
      { model: 'heading1', view: 'h1', title: '제목 1', class: 'ck-heading_heading1' },
      { model: 'heading2', view: 'h2', title: '제목 2', class: 'ck-heading_heading2' },
      { model: 'heading3', view: 'h3', title: '제목 3', class: 'ck-heading_heading3' }
    ]
  },
  list: {
    properties: {
      styles: true,
      startIndex: true,
      reversed: true
    }
  },
  language: 'en'
}; 