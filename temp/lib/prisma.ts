import crypto from "crypto";

// In-memory arrays to hold data
const users: any[] = [];
const assignments: any[] = [];
const rubrics: any[] = [];
const submissions: any[] = [];

// Helper function to deep clone objects to prevent shared reference mutations
function clone(obj: any) {
    if (!obj) return obj;
    return JSON.parse(JSON.stringify(obj));
}

export const prisma = {
    user: {
        findUnique: async (args: any) => {
            const { where } = args;
            let u = users.find(x => 
                (where.email && x.email === where.email) || 
                (where.id && x.id === where.id)
            );
            return clone(u) || null;
        },
        create: async (args: any) => {
            const { data } = args;
            const newUser = {
                id: crypto.randomUUID(),
                createdAt: new Date(),
                updatedAt: new Date(),
                ...data
            };
            users.push(newUser);
            return clone(newUser);
        }
    },
    assignment: {
        create: async (args: any) => {
            const { data } = args;
            const newAssignment = {
                id: crypto.randomUUID(),
                createdAt: new Date(),
                updatedAt: new Date(),
                maxScore: data.maxScore !== undefined ? data.maxScore : 100,
                ...data
            };
            assignments.push(newAssignment);
            return clone(newAssignment);
        },
        findMany: async (args: any = {}) => {
            const { where, include, orderBy } = args;
            let list = assignments.filter(x => {
                if (where?.teacherId && x.teacherId !== where.teacherId) return false;
                return true;
            });

            // orderBy
            if (orderBy?.createdAt === "desc") {
                list.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
            }

            // Map includes
            let results = list.map(x => {
                const item = clone(x);
                if (include?.rubric) {
                    item.rubric = clone(rubrics.find(r => r.id === item.rubricId)) || null;
                }
                if (include?._count?.select?.submissions) {
                    item._count = {
                        submissions: submissions.filter(s => s.assignmentId === item.id).length
                    };
                }
                return item;
            });

            return results;
        },
        findUnique: async (args: any) => {
            const { where, include } = args;
            let item = assignments.find(x => x.id === where.id);
            if (!item) return null;
            
            const result = clone(item);
            if (include?.teacher) {
                const t = users.find(u => u.id === result.teacherId);
                if (t) {
                    result.teacher = {
                        name: t.name,
                        email: t.email
                    };
                }
            }
            if (include?.rubric) {
                result.rubric = clone(rubrics.find(r => r.id === result.rubricId)) || null;
            }
            return result;
        },
        findFirst: async (args: any) => {
            const { where } = args;
            let item = assignments.find(x => {
                if (where.id && x.id !== where.id) return false;
                if (where.otp && x.otp !== where.otp) return false;
                return true;
            });
            return clone(item) || null;
        }
    },
    rubric: {
        create: async (args: any) => {
            const { data } = args;
            const newRubric = {
                id: crypto.randomUUID(),
                createdAt: new Date(),
                updatedAt: new Date(),
                ...data
            };
            rubrics.push(newRubric);
            return clone(newRubric);
        },
        findMany: async (args: any = {}) => {
            const { where, orderBy } = args;
            let list = rubrics.filter(x => {
                if (where?.teacherId && x.teacherId !== where.teacherId) return false;
                return true;
            });
            if (orderBy?.createdAt === "desc") {
                list.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
            }
            return clone(list);
        },
        findUnique: async (args: any) => {
            const { where } = args;
            let item = rubrics.find(x => x.id === where.id);
            return clone(item) || null;
        },
        update: async (args: any) => {
            const { where, data } = args;
            let item = rubrics.find(x => x.id === where.id);
            if (!item) throw new Error("Record not found");
            Object.assign(item, data, { updatedAt: new Date() });
            return clone(item);
        },
        delete: async (args: any) => {
            const { where } = args;
            const idx = rubrics.findIndex(x => x.id === where.id);
            if (idx === -1) throw new Error("Record not found");
            const deleted = rubrics.splice(idx, 1)[0];
            return clone(deleted);
        }
    },
    submission: {
        findFirst: async (args: any) => {
            const { where } = args;
            let item = submissions.find(x => {
                if (where.assignmentId && x.assignmentId !== where.assignmentId) return false;
                if (where.studentId && x.studentId !== where.studentId) return false;
                return true;
            });
            return clone(item) || null;
        },
        create: async (args: any) => {
            const { data } = args;
            const newSubmission = {
                id: crypto.randomUUID(),
                submittedAt: new Date(),
                status: data.status || "PENDING",
                score: data.score !== undefined ? data.score : null,
                feedback: data.feedback !== undefined ? data.feedback : null,
                ...data
            };
            submissions.push(newSubmission);
            return clone(newSubmission);
        },
        findMany: async (args: any = {}) => {
            const { where, include, orderBy, take } = args;
            let list = submissions.filter(x => {
                if (where?.studentId && x.studentId !== where.studentId) return false;
                if (where?.assignmentId && x.assignmentId !== where.assignmentId) return false;
                if (where?.assignment?.teacherId) {
                    const assocAssignment = assignments.find(a => a.id === x.assignmentId);
                    if (!assocAssignment || assocAssignment.teacherId !== where.assignment.teacherId) return false;
                }
                return true;
            });

            if (orderBy?.submittedAt === "desc") {
                list.sort((a, b) => b.submittedAt.getTime() - a.submittedAt.getTime());
            }

            if (take !== undefined) {
                list = list.slice(0, take);
            }

            let results = list.map(x => {
                const item = clone(x);
                if (include?.assignment) {
                    const assocAssignment = assignments.find(a => a.id === item.assignmentId);
                    if (assocAssignment) {
                        item.assignment = {};
                        if (include.assignment.select?.title) item.assignment.title = assocAssignment.title;
                        if (include.assignment.select?.dueDate) item.assignment.dueDate = assocAssignment.dueDate;
                    }
                }
                if (include?.student) {
                    const s = users.find(u => u.id === item.studentId);
                    if (s) {
                        item.student = {};
                        if (include.student.select?.name) item.student.name = s.name;
                        if (include.student.select?.email) item.student.email = s.email;
                    }
                }
                return item;
            });

            return results;
        },
        findUnique: async (args: any) => {
            const { where, include } = args;
            let item = submissions.find(x => x.id === where.id);
            if (!item) return null;

            const result = clone(item);
            if (include?.assignment) {
                result.assignment = clone(assignments.find(a => a.id === result.assignmentId)) || null;
            }
            if (include?.student) {
                result.student = clone(users.find(u => u.id === result.studentId)) || null;
            }
            return result;
        },
        update: async (args: any) => {
            const { where, data } = args;
            let item = submissions.find(x => x.id === where.id);
            if (!item) throw new Error("Record not found");
            Object.assign(item, data);
            return clone(item);
        },
        delete: async (args: any) => {
            const { where } = args;
            const idx = submissions.findIndex(x => x.id === where.id);
            if (idx === -1) throw new Error("Record not found");
            const deleted = submissions.splice(idx, 1)[0];
            return clone(deleted);
        }
    }
};
