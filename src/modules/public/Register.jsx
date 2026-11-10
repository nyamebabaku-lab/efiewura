import { useState } from 'react';
import { Modal, Button, FormFields, toast } from '../../components/ui';
import { useStore } from '../../data/store';

const FIELDS = [
  { name: 'name', label: 'Your full name', required: true, placeholder: 'e.g. Kwame Mensah' },
  { name: 'phone', label: 'Phone (MoMo)', type: 'tel', required: true, placeholder: '024 123 4567' },
  { name: 'email', label: 'Email', type: 'email', required: true },
  { name: 'company', label: 'Company / business name', placeholder: 'You can change this later' },
  { name: 'ghanaCard', label: 'Ghana Card number', required: true, placeholder: 'GHA-000000000-0' },
  { name: 'businessReg', label: 'Business registration no.', placeholder: 'Optional (ORC/RGD)' },
  { name: 'address', label: 'Business address / GPS', span: 2, placeholder: 'e.g. GA-123-4567, Dansoman' },
];

export default function Register({ open, onClose }) {
  const registerOwner = useStore((s) => s.registerOwner);
  const [v, setV] = useState({});
  const submit = (e) => {
    e.preventDefault();
    const missing = FIELDS.filter((f) => f.required && !v[f.name]);
    if (missing.length) return toast.error('Missing information', missing.map((m) => m.label).join(', '));
    if (!/^0\d{9}$/.test((v.phone || '').replace(/\s/g, ''))) return toast.error('Check the phone number', 'Use 10 digits, e.g. 0241234567');
    registerOwner({ ...v, phone: v.phone.replace(/\s/g, '') });
    toast.success('Account created', 'Now let’s set up your brand');
    return onClose();
  };
  return (
    <Modal open={open} onClose={onClose} title="Register your property business" subtitle="Efie Wura checks your Ghana Card before online payments and withdrawals are switched on." size="lg"
      footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button type="submit" form="reg">Create account</Button></>}>
      <form id="reg" onSubmit={submit}>
        <FormFields fields={FIELDS} value={v} onChange={setV} />
        <p className="mt-4 text-xs text-slate-500">In the live app you will confirm your phone with a one-time code. In this demo the account is created straight away.</p>
      </form>
    </Modal>
  );
}
