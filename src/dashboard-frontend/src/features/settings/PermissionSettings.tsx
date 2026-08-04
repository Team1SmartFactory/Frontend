import { useEffect, useState, type FormEvent } from 'react';
import { usePermissions, useUpdatePermissions } from '../../shared/query/useSettings';
import { Button, Card, Switch, TextField } from '../../shared/ui';
import styles from './PermissionSettings.module.css';

/** 설정 탭의 "로봇 제어 승인 권한 설정". */
export function PermissionSettings() {
  const { permissions, isPending } = usePermissions();
  const updatePermissions = useUpdatePermissions();

  const savedApprovers = permissions.authorizedApprovers.join(', ');
  const [approverInput, setApproverInput] = useState(savedApprovers);

  // 서버 값이 늦게 도착하거나 다른 창에서 바뀌면 입력란을 따라가게 한다.
  // 사용자가 편집 중일 때는 덮어쓰지 않도록 저장된 값과 같을 때만 동기화한다.
  useEffect(() => {
    setApproverInput((current) => (current === '' ? savedApprovers : current));
  }, [savedApprovers]);

  const isDirty = approverInput.trim() !== savedApprovers;
  const isSaving = updatePermissions.isPending;

  function handleApproverSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    const approvers = approverInput
      .split(',')
      .map((name) => name.trim())
      .filter(Boolean);
    updatePermissions.mutate({ ...permissions, authorizedApprovers: approvers });
  }

  return (
    <Card title="로봇 제어 승인 권한" subtitle="부족 감지 후 로봇을 어떻게 동작시킬지 결정합니다.">
      <div className={styles.body}>
        <Switch
          checked={permissions.approvalRequired}
          disabled={isPending || isSaving}
          onChange={(approvalRequired) =>
            updatePermissions.mutate({ ...permissions, approvalRequired })
          }
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
            disabled={isPending}
            onChange={(event) => setApproverInput(event.target.value)}
          />
          <Button type="submit" variant="primary" size="sm" disabled={!isDirty || isSaving}>
            {isSaving ? '저장 중…' : isDirty ? '저장' : '저장됨'}
          </Button>
        </form>

        {updatePermissions.isError && (
          <p className={styles.error} role="alert">
            설정을 저장하지 못했습니다. {updatePermissions.error.message}
          </p>
        )}
      </div>
    </Card>
  );
}
