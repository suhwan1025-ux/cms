import React, { useState, useEffect } from 'react';

const TeamManagement = () => {
  const [teams, setTeams] = useState([]);
  const [newTeam, setNewTeam] = useState({ name: '', description: '' });
  const [editingTeam, setEditingTeam] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', description: '' });

  useEffect(() => {
    // 실제 데이터는 API에서 가져올 예정
    setTeams([
      {
        id: 1,
        name: 'IT팀',
        description: '정보기술 관련 업무 담당',
        memberCount: 8,
        manager: '김철수'
      },
      {
        id: 2,
        name: '총무팀',
        description: '인사, 행정 업무 담당',
        memberCount: 5,
        manager: '이영희'
      },
      {
        id: 3,
        name: '기획팀',
        description: '사업 기획 및 전략 수립',
        memberCount: 6,
        manager: '박민수'
      }
    ]);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (newTeam.name.trim()) {
      const team = {
        id: Date.now(),
        name: newTeam.name,
        description: newTeam.description,
        memberCount: 0,
        manager: '미지정'
      };
      setTeams([...teams, team]);
      setNewTeam({ name: '', description: '' });
    }
  };

  // 팀 수정 시작
  const handleEdit = (team) => {
    setEditingTeam(team.id);
    setEditForm({
      name: team.name,
      description: team.description
    });
  };

  // 팀 수정 취소
  const handleCancelEdit = () => {
    setEditingTeam(null);
    setEditForm({ name: '', description: '' });
  };

  // 팀 수정 저장
  const handleSaveEdit = (teamId) => {
    if (editForm.name.trim()) {
      setTeams(teams.map(team => 
        team.id === teamId 
          ? { ...team, name: editForm.name, description: editForm.description }
          : team
      ));
      setEditingTeam(null);
      setEditForm({ name: '', description: '' });
    }
  };

  // 팀 삭제
  const handleDelete = (teamId) => {
    if (window.confirm('정말로 이 팀을 삭제하시겠습니까?')) {
      setTeams(teams.filter(team => team.id !== teamId));
    }
  };

  return (
    <div className="team-management">
      <h1>팀 관리</h1>
      
      <div className="add-team-section">
        <h2>새 팀 추가</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>팀명</label>
            <input
              type="text"
              value={newTeam.name}
              onChange={(e) => setNewTeam({...newTeam, name: e.target.value})}
              required
            />
          </div>
          <div className="form-group">
            <label>설명</label>
            <textarea
              value={newTeam.description}
              onChange={(e) => setNewTeam({...newTeam, description: e.target.value})}
              rows="3"
            />
          </div>
          <button type="submit" className="submit-btn">팀 추가</button>
        </form>
      </div>

      <div className="teams-list">
        <h2>팀 목록</h2>
        <div className="teams-grid">
          {teams.map(team => (
            <div key={team.id} className="team-card">
              {editingTeam === team.id ? (
                // 편집 모드
                <div className="edit-mode">
                  <div className="form-group">
                    <label>팀명</label>
                    <input
                      type="text"
                      value={editForm.name}
                      onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>설명</label>
                    <textarea
                      value={editForm.description}
                      onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                      rows="3"
                    />
                  </div>
                  <div className="edit-actions">
                    <button 
                      type="button" 
                      className="save-btn"
                      onClick={() => handleSaveEdit(team.id)}
                    >
                      저장
                    </button>
                    <button 
                      type="button" 
                      className="cancel-btn"
                      onClick={handleCancelEdit}
                    >
                      취소
                    </button>
                  </div>
                </div>
              ) : (
                // 보기 모드
                <>
                  <h3>{team.name}</h3>
                  <p>{team.description}</p>
                  <div className="team-stats">
                    <span>팀원 수: {team.memberCount}명</span>
                    <span>팀장: {team.manager}</span>
                  </div>
                  <div className="team-actions">
                    <button 
                      type="button" 
                      className="edit-btn"
                      onClick={() => handleEdit(team)}
                    >
                      수정
                    </button>
                    <button 
                      type="button" 
                      className="delete-btn"
                      onClick={() => handleDelete(team.id)}
                    >
                      삭제
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      <style jsx="true">{`
        .team-management {
          max-width: 1200px;
          margin: 0 auto;
        }

        .add-team-section {
          background: white;
          padding: 2rem;
          border-radius: 12px;
          margin-bottom: 2rem;
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }

        .teams-list h2 {
          margin-bottom: 1.5rem;
          color: #333;
        }

        .team-card {
          position: relative;
          background: white;
          padding: 1.5rem;
          border-radius: 12px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          transition: transform 0.3s ease;
        }

        .team-card:hover {
          transform: translateY(-4px);
        }

        .team-card h3 {
          margin: 0 0 1rem 0;
          color: #333;
          font-size: 1.25rem;
        }

        .team-card p {
          color: #666;
          margin-bottom: 1rem;
          line-height: 1.5;
        }

        .team-stats {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
          margin-bottom: 1rem;
          font-size: 0.9rem;
          color: #888;
        }

        .team-actions {
          display: flex;
          gap: 0.5rem;
          margin-top: 1rem;
        }

        .edit-btn, .delete-btn {
          padding: 0.5rem 1rem;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 0.9rem;
          font-weight: 500;
          transition: all 0.3s ease;
        }

        .edit-btn {
          background: #007bff;
          color: white;
        }

        .edit-btn:hover {
          background: #0056b3;
        }

        .delete-btn {
          background: #dc3545;
          color: white;
        }

        .delete-btn:hover {
          background: #c82333;
        }

        .edit-mode {
          padding: 0;
        }

        .edit-mode .form-group {
          margin-bottom: 1rem;
        }

        .edit-actions {
          display: flex;
          gap: 0.5rem;
          margin-top: 1rem;
        }

        .save-btn, .cancel-btn {
          padding: 0.5rem 1rem;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 0.9rem;
          font-weight: 500;
          transition: all 0.3s ease;
        }

        .save-btn {
          background: #28a745;
          color: white;
        }

        .save-btn:hover {
          background: #218838;
        }

        .cancel-btn {
          background: #6c757d;
          color: white;
        }

        .cancel-btn:hover {
          background: #5a6268;
        }

        @media (max-width: 768px) {
          .team-actions {
            flex-direction: column;
          }
          
          .edit-actions {
            flex-direction: column;
          }
          
          .team-stats {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default TeamManagement; 