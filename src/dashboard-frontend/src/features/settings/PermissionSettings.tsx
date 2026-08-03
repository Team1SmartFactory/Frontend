import { useState, type FormEvent } from 'react';
import { useUiStore } from '../../store/useUiStore';
import styles from './PermissionSettings.module.css';

/** 설정 탭의 "로봇 제어 승인 권한 설정". */
export function PermissionSettings() {
  const permissions = useUiStore((state) => state.permissions);
  const setPermissions = useUiStore((state) => state.setPermissions);
  const [approverInput, setApproverInput] = useState(permissions.authorizedApprovers.join(', '));

  function handleApproverSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    const approvers = approverInput
      .split(',')
      .map((name) => name.trim())
      .filter(Boolean);
    setPermissions({ ...permissions, authorizedApprovers: approvers });
  }

  return (
    <div className={styles.panel}>
      <h4>로봇 제어 승인 권한</h4>

      <label className={styles.toggleRow}>
        <input
          type="checkbox"
          checked={permissions.approvalRequired}
          onChange={(event) => setPermissions({ ...permissions, approvalRequired: event.target.checked })}
        />
        부품 부족 시 관리자 승인 필수
      </label>

      <form onSubmit={handleApproverSubmit}>
        <label>
          승인 권한 보유자 (쉼표로 구분)
          <input value={approverInput} onChange={(event) => setApproverInput(event.target.value)} />
        </label>
        <button type="submit">저장</button>
      </form>
    </div>
  );
}
