import { useEffect } from 'react';
import { Avatar, Button, Divider, Form, Input, message, Modal, Space, Switch, Tabs, Tag, Typography } from 'antd';
import { LogoutOutlined, SoundOutlined, UserOutlined } from '@ant-design/icons';
import { getUserPreferences, saveUserPreferences, type UserPreferences } from '../utils/userPreferences';

const { Paragraph, Text, Title } = Typography;

export interface AccountUser {
  id?: number;
  username?: string;
  email?: string;
  emailVerified?: boolean;
}

interface AccountModalProps {
  open: boolean;
  user: AccountUser | null;
  onClose: () => void;
  onLogout: () => void;
  onProfileSaved: (displayName: string) => void;
}

export default function AccountModal({ open, user, onClose, onLogout, onProfileSaved }: AccountModalProps) {
  const [form] = Form.useForm<UserPreferences>();

  useEffect(() => {
    if (open) form.setFieldsValue(getUserPreferences());
  }, [form, open]);

  const save = (values: UserPreferences) => {
    const preferences = { ...getUserPreferences(), ...values, displayName: values.displayName.trim() };
    saveUserPreferences(preferences);
    onProfileSaved(preferences.displayName);
    message.success('Profile and preferences saved.');
    onClose();
  };

  const profile = (
    <div className="pt-2">
      <div className="flex items-center gap-4 rounded-2xl bg-[#123d3a] p-5 text-white">
        <Avatar size={58} icon={<UserOutlined />} className="bg-white/15" />
        <div className="min-w-0">
          <Title level={4} className="!mb-0 !text-white">{user?.username || 'Student'}</Title>
          <Text className="!text-white/60">{user?.email || 'No email available'}</Text>
          <div className="mt-2"><Tag color={user?.emailVerified ? 'success' : 'warning'}>{user?.emailVerified ? 'Verified account' : 'Email not verified'}</Tag></div>
        </div>
      </div>
      <Divider />
      <Form.Item name="displayName" label="Preferred display name" extra="This changes how SAT-Buddy greets you on this device.">
        <Input maxLength={40} placeholder={user?.username || 'Student'} />
      </Form.Item>
      <div className="rounded-2xl border border-stone-900/10 bg-stone-50 p-4">
        <Text strong>Account email</Text>
        <Paragraph copyable className="!mb-0 !mt-1 !text-stone-500">{user?.email || 'Not available'}</Paragraph>
      </div>
    </div>
  );

  const settings = (
    <div className="space-y-3 pt-2">
      <div className="flex items-center justify-between gap-4 rounded-2xl border border-stone-900/10 p-4">
        <div><Text strong>Correct-answer sounds</Text><Paragraph className="!mb-0 !mt-1 !text-xs !text-stone-500">Play a short chime after a correct response.</Paragraph></div>
        <Form.Item name="soundEffects" valuePropName="checked" noStyle><Switch aria-label="Correct-answer sounds" /></Form.Item>
      </div>
      <div className="flex items-center justify-between gap-4 rounded-2xl border border-stone-900/10 p-4">
        <div><Text strong>Celebration animation</Text><Paragraph className="!mb-0 !mt-1 !text-xs !text-stone-500">Show the animated reward after a correct response.</Paragraph></div>
        <Form.Item name="celebrations" valuePropName="checked" noStyle><Switch aria-label="Celebration animation" /></Form.Item>
      </div>
      <div className="rounded-2xl bg-[#e6d8bb]/35 p-4 text-sm text-stone-600"><SoundOutlined className="mr-2 text-[#123d3a]" />Dictionary pronunciation remains available even when answer sounds are off.</div>
    </div>
  );

  return (
    <Modal open={open} onCancel={onClose} title="Your SAT-Buddy account" footer={null} width={620} destroyOnHidden>
      <Form form={form} layout="vertical" initialValues={getUserPreferences()} onFinish={save}>
        <Tabs items={[{ key: 'profile', label: 'Profile', children: profile }, { key: 'settings', label: 'Settings', children: settings }]} />
        <Divider />
        <div className="flex flex-wrap justify-between gap-3">
          <Button danger icon={<LogoutOutlined />} onClick={onLogout}>Log out</Button>
          <Space><Button onClick={onClose}>Cancel</Button><Button type="primary" htmlType="submit">Save changes</Button></Space>
        </div>
      </Form>
    </Modal>
  );
}
