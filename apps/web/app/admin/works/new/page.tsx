import { WorkForm } from "@/components/admin/work-form";

export default function NewWorkPage() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">New book</h1>
      <WorkForm />
    </div>
  );
}
