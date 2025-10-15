import React, { useState, useEffect } from 'react';
import { getApiUrl } from '../config/api';
import CKEditorComponent from './CKEditorComponent';
import './TemplateManagement.css';

const API_BASE_URL = getApiUrl();

const TemplateManagement = () => {
  const [templates, setTemplates] = useState([]);
  const [filteredTemplates, setFilteredTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [filterCategory, setFilterCategory] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    content: '',
    category: 'general',
    displayOrder: 0
  });
  
  // CKEditor 강제 리렌더링을 위한 key
  const [editorKey, setEditorKey] = useState(0);
  // CKEditor 렌더링 준비 상태
  const [editorReady, setEditorReady] = useState(false);
  
  // 모달 드래그 상태
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [modalPosition, setModalPosition] = useState({ x: 0, y: 0 });

  // 템플릿 목록 조회
  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/document-templates`);
      const data = await response.json();
      setTemplates(data);
      setFilteredTemplates(data);
    } catch (error) {
      console.error('템플릿 목록 조회 오류:', error);
      alert('템플릿 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  // 필터링
  useEffect(() => {
    let filtered = templates;
    
    if (filterCategory) {
      filtered = filtered.filter(t => t.category === filterCategory);
    }
    
    if (searchTerm) {
      filtered = filtered.filter(t => 
        t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (t.description && t.description.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    
    setFilteredTemplates(filtered);
  }, [filterCategory, searchTerm, templates]);

  // 모달 열기 (신규/수정)
  const openModal = (template = null) => {
    // 먼저 CKEditor를 숨김
    setEditorReady(false);
    
    if (template) {
      console.log('템플릿 수정 모드:', template);
      console.log('템플릿 내용 길이:', template.content?.length);
      console.log('템플릿 내용 미리보기:', template.content?.substring(0, 100));
      
      setEditingTemplate(template);
      
      // formData 설정
      const newFormData = {
        name: template.name,
        description: template.description || '',
        content: template.content || '',
        category: template.category || 'general',
        displayOrder: template.displayOrder || 0
      };
      
      setFormData(newFormData);
      setEditorKey(prev => prev + 1);
      setShowModal(true);
      
      // 모달이 완전히 열린 후 CKEditor 렌더링
      setTimeout(() => {
        console.log('🔄 CKEditor 렌더링 시작, content 길이:', newFormData.content?.length);
        setEditorReady(true);
      }, 100);
    } else {
      console.log('템플릿 신규 작성 모드');
      
      setEditingTemplate(null);
      setFormData({
        name: '',
        description: '',
        content: '',
        category: 'general',
        displayOrder: 0
      });
      
      setEditorKey(prev => prev + 1);
      setShowModal(true);
      
      setTimeout(() => {
        setEditorReady(true);
      }, 100);
    }
  };

  // 모달 닫기
  const closeModal = () => {
    setEditorReady(false);
    setShowModal(false);
    setEditingTemplate(null);
    setFormData({
      name: '',
      description: '',
      content: '',
      category: 'general',
      displayOrder: 0
    });
    setEditorKey(prev => prev + 1);
    setModalPosition({ x: 0, y: 0 });
  };
  
  // 모달 드래그 핸들러
  const handleMouseDown = (e) => {
    if (e.target.closest('.modal-header')) {
      setIsDragging(true);
      setDragOffset({
        x: e.clientX - modalPosition.x,
        y: e.clientY - modalPosition.y
      });
    }
  };
  
  const handleMouseMove = (e) => {
    if (isDragging) {
      setModalPosition({
        x: e.clientX - dragOffset.x,
        y: e.clientY - dragOffset.y
      });
    }
  };
  
  const handleMouseUp = () => {
    setIsDragging(false);
  };
  
  // 드래그 이벤트 리스너
  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragOffset]);

  // 저장
  const handleSave = async () => {
    try {
      // 유효성 검사
      if (!formData.name.trim()) {
        alert('템플릿 이름을 입력하세요.');
        return;
      }
      if (!formData.content.trim()) {
        alert('템플릿 내용을 입력하세요.');
        return;
      }

      const url = editingTemplate
        ? `${API_BASE_URL}/api/document-templates/${editingTemplate.id}`
        : `${API_BASE_URL}/api/document-templates`;
      
      const method = editingTemplate ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '저장 실패');
      }

      alert(editingTemplate ? '템플릿이 수정되었습니다.' : '템플릿이 추가되었습니다.');
      closeModal();
      fetchTemplates();
    } catch (error) {
      console.error('템플릿 저장 오류:', error);
      alert(`저장 실패: ${error.message}`);
    }
  };

  // 삭제
  const handleDelete = async (template) => {
    if (!window.confirm(`"${template.name}" 템플릿을 삭제하시겠습니까?`)) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/document-templates/${template.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('삭제 실패');
      }

      alert('템플릿이 삭제되었습니다.');
      fetchTemplates();
    } catch (error) {
      console.error('템플릿 삭제 오류:', error);
      alert('템플릿 삭제에 실패했습니다.');
    }
  };

  // 미리보기
  const handlePreview = (template) => {
    const previewWindow = window.open('', '_blank', 'width=800,height=600');
    previewWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>${template.name} - 미리보기</title>
          <style>
            body {
              font-family: 'Malgun Gothic', sans-serif;
              padding: 40px;
              line-height: 1.6;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin: 20px 0;
            }
            th, td {
              border: 1px solid #ddd;
              padding: 10px;
              text-align: left;
            }
            th {
              background-color: #f8f9fa;
              font-weight: bold;
            }
            h1 {
              text-align: center;
              margin-bottom: 30px;
            }
            h2 {
              margin-top: 30px;
              border-bottom: 2px solid #333;
              padding-bottom: 5px;
            }
          </style>
        </head>
        <body>
          ${template.content}
        </body>
      </html>
    `);
    previewWindow.document.close();
  };

  if (loading) {
    return <div className="template-management"><p>로딩 중...</p></div>;
  }

  return (
    <div className="template-management">
      <div className="template-header">
        <h2>📋 문서 템플릿 관리</h2>
        <button className="btn-add" onClick={() => openModal()}>
          ➕ 새 템플릿 추가
        </button>
      </div>

      <div className="template-filters">
        <div className="filter-group">
          <label>카테고리</label>
          <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
            <option value="">전체</option>
            <option value="general">일반</option>
            <option value="bidding">입찰</option>
            <option value="contract">계약</option>
          </select>
        </div>
        <div className="filter-group">
          <label>검색</label>
          <input
            type="text"
            placeholder="템플릿 이름 또는 설명 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="template-list">
        {filteredTemplates.length === 0 ? (
          <p className="no-data">템플릿이 없습니다.</p>
        ) : (
          <div className="template-grid">
            {filteredTemplates.map((template) => (
              <div key={template.id} className="template-card">
                <div className="template-card-header">
                  <h3>{template.name}</h3>
                  <span className={`category-badge category-${template.category}`}>
                    {template.category === 'general' ? '일반' : 
                     template.category === 'bidding' ? '입찰' : '계약'}
                  </span>
                </div>
                <p className="template-description">{template.description}</p>
                <div className="template-actions">
                  <button 
                    className="btn-preview" 
                    onClick={() => handlePreview(template)}
                    title="미리보기"
                  >
                    👁️ 미리보기
                  </button>
                  <button 
                    className="btn-edit" 
                    onClick={() => openModal(template)}
                    title="수정"
                  >
                    ✏️ 수정
                  </button>
                  <button 
                    className="btn-delete" 
                    onClick={() => handleDelete(template)}
                    title="삭제"
                  >
                    🗑️ 삭제
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 템플릿 추가/수정 모달 */}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div 
            className="modal-content" 
            onClick={(e) => e.stopPropagation()}
            style={{
              transform: `translate(${modalPosition.x}px, ${modalPosition.y}px)`,
              cursor: isDragging ? 'grabbing' : 'default'
            }}
          >
            <div 
              className="modal-header" 
              onMouseDown={handleMouseDown}
              style={{ cursor: 'grab' }}
            >
              <h3>{editingTemplate ? '템플릿 수정' : '새 템플릿 추가'}</h3>
              <button className="modal-close" onClick={closeModal}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>템플릿 이름 <span className="required">*</span></label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="예: 구매계약 품의서"
                />
              </div>
              <div className="form-group">
                <label>설명</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="템플릿 설명을 입력하세요"
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>카테고리</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  >
                    <option value="general">일반</option>
                    <option value="bidding">입찰</option>
                    <option value="contract">계약</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>표시 순서</label>
                  <input
                    type="number"
                    value={formData.displayOrder}
                    onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value) || 0 })}
                    min="0"
                  />
                </div>
              </div>
              <div className="form-group">
                <label>템플릿 내용 <span className="required">*</span></label>
                <div className="ckeditor-wrapper">
                  {editorReady ? (
                    <CKEditorComponent
                      key={`editor-${editorKey}-${editingTemplate?.id || 'new'}`}
                      data={formData.content}
                      onChange={(data) => {
                        console.log('📝 CKEditor 내용 변경, 길이:', data?.length);
                        setFormData(prev => ({ ...prev, content: data }));
                      }}
                    />
                  ) : (
                    <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>
                      에디터 로딩 중...
                    </div>
                  )}
                </div>
                <p className="field-hint">
                  💡 CKEditor를 사용하여 서식이 적용된 템플릿을 작성할 수 있습니다.
                </p>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={closeModal}>취소</button>
              <button className="btn-save" onClick={handleSave}>
                {editingTemplate ? '수정' : '추가'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TemplateManagement;

