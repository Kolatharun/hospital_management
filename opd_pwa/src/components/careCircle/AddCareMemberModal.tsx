import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CareMember, CareRelationship } from '../../types';
import { careCircleService } from '../../services/careCircleService';
import { X, UserPlus, Loader2, CheckCircle } from 'lucide-react';

const addMemberSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  relationship: z.enum(['father', 'mother', 'child', 'spouse', 'sibling', 'other']),
  age: z.coerce.number().min(1, 'Age must be at least 1').max(120, 'Age must be valid'),
  gender: z.enum(['male', 'female', 'other']),
  bloodGroup: z.string().min(1, 'Blood group is required'),
  mobile: z.string().regex(/^[6-9]\d{9}$/, 'Enter valid 10-digit mobile number'),
});

export type AddMemberFormValues = z.infer<typeof addMemberSchema>;

interface AddCareMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newMember: CareMember) => void;
}

export const AddCareMemberModal: React.FC<AddCareMemberModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(addMemberSchema),
    defaultValues: {
      fullName: '',
      relationship: 'father' as const,
      age: 60,
      gender: 'male' as const,
      bloodGroup: 'B+',
      mobile: '9876543210',
    },
  });

  if (!isOpen) return null;

  const onSubmit = async (values: AddMemberFormValues) => {
    setIsSubmitting(true);
    try {
      const relationshipLabels: Record<CareRelationship, string> = {
        myself: 'Myself',
        father: 'Father',
        mother: 'Mother',
        child: 'Child',
        spouse: 'Spouse',
        sibling: 'Sibling',
        other: 'Family Member',
      };

      const newMember = await careCircleService.addCareMember({
        fullName: values.fullName,
        relationship: values.relationship as CareRelationship,
        relationshipLabel: relationshipLabels[values.relationship as CareRelationship] || 'Family Member',
        age: values.age,
        gender: values.gender as 'male' | 'female' | 'other',
        bloodGroup: values.bloodGroup,
        emergencyContact: `+91${values.mobile}`,
      });

      reset();
      onSuccess(newMember);
      onClose();
    } catch (err) {
      console.error('Failed to add care member:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-[24px] w-full max-w-[440px] p-6 shadow-2xl border border-[#DCE6E7] relative max-h-[90vh] overflow-y-auto">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-[#708188] hover:bg-[#F7F9F8] hover:text-[#16343C] transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-[#0B6875]/10 text-[#0B6875] flex items-center justify-center font-bold">
            <UserPlus className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-[#16343C]">Link Family Member</h3>
            <p className="text-xs text-[#708188]">Add dependent to your Care Circle</p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          {/* Full Name */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-[#16343C]">Full Name</label>
            <input
              type="text"
              placeholder="e.g. Suresh Kumar Sharma"
              {...register('fullName')}
              className="px-3.5 py-2.5 rounded-xl border border-[#DCE6E7] text-sm text-[#16343C] focus:outline-none focus:border-[#0B6875] focus:ring-2 focus:ring-[#0B6875]/20"
            />
            {errors.fullName && <span className="text-[11px] text-[#C94B4B]">{errors.fullName.message}</span>}
          </div>

          {/* Relationship & Gender */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-[#16343C]">Relationship</label>
              <select
                {...register('relationship')}
                className="px-3 py-2.5 rounded-xl border border-[#DCE6E7] text-sm text-[#16343C] focus:outline-none focus:border-[#0B6875]"
              >
                <option value="father">Father</option>
                <option value="mother">Mother</option>
                <option value="child">Child</option>
                <option value="spouse">Spouse</option>
                <option value="sibling">Sibling</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-[#16343C]">Gender</label>
              <select
                {...register('gender')}
                className="px-3 py-2.5 rounded-xl border border-[#DCE6E7] text-sm text-[#16343C] focus:outline-none focus:border-[#0B6875]"
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          {/* Age & Blood Group */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-[#16343C]">Age (Years)</label>
              <input
                type="number"
                {...register('age')}
                className="px-3 py-2.5 rounded-xl border border-[#DCE6E7] text-sm text-[#16343C] focus:outline-none focus:border-[#0B6875]"
              />
              {errors.age && <span className="text-[11px] text-[#C94B4B]">{errors.age.message}</span>}
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-[#16343C]">Blood Group</label>
              <select
                {...register('bloodGroup')}
                className="px-3 py-2.5 rounded-xl border border-[#DCE6E7] text-sm text-[#16343C] focus:outline-none focus:border-[#0B6875]"
              >
                <option value="B+">B Rh Pos (B+)</option>
                <option value="O+">O Rh Pos (O+)</option>
                <option value="A+">A Rh Pos (A+)</option>
                <option value="AB+">AB Rh Pos (AB+)</option>
                <option value="B-">B Rh Neg (B-)</option>
                <option value="O-">O Rh Neg (O-)</option>
              </select>
            </div>
          </div>

          {/* Mobile Number */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-[#16343C]">Registered Mobile Number</label>
            <input
              type="tel"
              maxLength={10}
              placeholder="10-digit mobile number"
              {...register('mobile')}
              className="px-3.5 py-2.5 rounded-xl border border-[#DCE6E7] text-sm text-[#16343C] focus:outline-none focus:border-[#0B6875]"
            />
            {errors.mobile && <span className="text-[11px] text-[#C94B4B]">{errors.mobile.message}</span>}
          </div>

          <div className="p-3 rounded-xl bg-[#DFF3F5]/60 border border-[#0B6875]/20 text-[11px] text-[#0B6875] font-medium flex items-center gap-2">
            <CheckCircle className="w-4 h-4 shrink-0 text-[#0B6875]" />
            <span>Linking authorizes access to health timelines & emergency alerts.</span>
          </div>

          <div className="flex gap-2 mt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-[#F7F9F8] text-[#708188] py-3 rounded-xl font-semibold text-xs hover:bg-[#EAEFEF] transition-colors cursor-pointer text-center"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-[#0B6875] text-white py-3 rounded-xl font-bold text-xs hover:bg-[#084F59] transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Linking...</span>
                </>
              ) : (
                <span>Confirm & Link Member</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
