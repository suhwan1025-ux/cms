import React, { useState, useEffect } from 'react';
import { CKEditor } from '@ckeditor/ckeditor5-react';
import ClassicEditor from '../ckeditor/CustomEditor';
import './CKEditorComponent.css';

const CKEditorComponent = ({ 
  value = '', 
  data = '', // data prop도 지원 (하위 호환성)
  onChange, 
  placeholder = "문서 내용을 입력하세요...",
  height = "400px",
  disabled = false
}) => {
  // data prop이 전달되면 우선 사용
  const editorContent = data || value;
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState(null);

  return (
    <div className="custom-ckeditor-container">
      <div className="editor-header">
        <h3>📝 커스텀 CKEditor 5</h3>
        <p>✨ 전문적인 문서 편집기 - 표 편집, 서식, 링크 등 지원</p>
      </div>

      {error && (
        <div className="editor-error">
          <h4>⚠️ 에디터 오류</h4>
          <p>{error}</p>
          <button 
            onClick={() => {
              setError(null);
              setIsReady(false);
            }}
            className="retry-button"
          >
            다시 시도
          </button>
        </div>
      )}

      {!error && (
        <div 
          className={`editor-wrapper ${disabled ? 'disabled' : ''}`}
          style={{ minHeight: height }}
        >
          <CKEditor
            editor={ClassicEditor}
            data={editorContent}
            disabled={disabled}
            config={{
              licenseKey: 'GPL', // GPL 라이선스 사용
              placeholder: placeholder,
              toolbar: {
                shouldNotGroupWhenFull: true, // 툴바 그룹화 비활성화 - 항상 모든 버튼 표시
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
              alignment: {
                options: ['left', 'center', 'right', 'justify']
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
                tableToolbar: ['bold', 'italic']
              },
              heading: {
                options: [
                  { model: 'paragraph', title: '본문', class: 'ck-heading_paragraph' },
                  { model: 'heading1', view: 'h1', title: '제목 1', class: 'ck-heading_heading1' },
                  { model: 'heading2', view: 'h2', title: '제목 2', class: 'ck-heading_heading2' },
                  { model: 'heading3', view: 'h3', title: '제목 3', class: 'ck-heading_heading3' }
                ]
              }
            }}
            onReady={(editor) => {
              console.log('✅ 커스텀 CKEditor5가 준비되었습니다!', editor);
              console.log('📄 초기 데이터 길이:', editorContent?.length);
              console.log('📄 초기 데이터 미리보기:', editorContent?.substring(0, 100));
              setIsReady(true);
              setError(null);
            }}
            onChange={(event, editor) => {
              const data = editor.getData();
              if (onChange) {
                onChange(data);
              }
            }}
            onError={(error, { willEditorRestart }) => {
              console.error('❌ CKEditor5 오류:', error);
              setError(`에디터 오류: ${error.message}`);
              
              if (willEditorRestart) {
                console.log('🔄 에디터가 재시작됩니다...');
              }
            }}
          />
        </div>
      )}

      <div className="editor-footer">
        <div className="status-indicator">
          <span className={`status-dot ${isReady ? 'ready' : 'loading'}`}></span>
          <span className="status-text">
            {isReady ? '준비됨' : '로딩 중...'}
          </span>
        </div>
        
        <div className="editor-features">
          <h4>🎯 지원 기능</h4>
          <div className="feature-list">
            <span className="feature-item">📝 텍스트 서식</span>
            <span className="feature-item">🔤 글자크기</span>
            <span className="feature-item">🎨 글자색</span>
            <span className="feature-item">🖍️ 배경색</span>
            <span className="feature-item">📊 표 편집</span>
            <span className="feature-item">🔗 링크</span>
            <span className="feature-item">📋 목록</span>
            <span className="feature-item">📑 제목</span>
            <span className="feature-item">↔️ 정렬</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CKEditorComponent; 