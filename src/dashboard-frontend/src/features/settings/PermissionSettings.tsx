import { useState, type FormEvent } from 'react';
import { useUiStore } from '../../store/useUiStore';
import { Button, Card, Switch, TextField } from '../../shared/ui';
import styles from './PermissionSettings.module.css';

/** 설정 탭의 "로봇 제어 승인 권한 설정". */
export function PermissionSettings() {
  const permissions = useUiStore((state) => state.permissions);
  const setPermissions = useUiStore((state) => state.setPermissions);
  const [approverInput, setApproverInput] = useState(permissions.authorizedApprovers.join(', '));

  const savedApprovers = permissions.authorizedApprovers.join(', ');
  const isDirty = approverInput.trim() !== savedApprovers;

  function handleApproverSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    const approvers = approverInput
      .split(',')
      .map((name) => name.trim())
      .filter(Boolean);
    setPermissions({ ...permissions, authorizedApprovers: approvers });
  }

  return (
    <Card title="로봇 제어 승인 권한" subtitle="부족 감지 후 로봇을 어떻게 동작시킬지 결정합니다.">
      <div className={styles.body}>
        <Switch
          checked={permissions.approvalRequired}
          onChange={(approvalRequired) => setPermissions({ ...permissions, approvalRequired })}
          label="관리자 승인 필수"
          description={
            permissions.approvalRequired
              ? '부족 발생 시 승인 팝업을 띄우고, 승인 후에만 로봇이 움직입니다.'
              : '승인 없이 로봇이 즉시 보충 작업을 시작합니다.'
          }
        />

        <form className={styles.form} onSubmit={handleApproverSubmit}>
          <TextField
            label="승인 권한 보유자"
            hint="쉼표로 구분해 입력합니다. 예: admin, manager"
            value={approverInput}
            onChange={(event) => setApproverInput(event.target.value)}
          />
          <Button type="submit" variant="primary" size="sm" disabled={!isDirty}>
            {isDirty ? '저장' : '저장됨'}
          </Button>
        </form>
      </div>
    </Card>
  );
}
