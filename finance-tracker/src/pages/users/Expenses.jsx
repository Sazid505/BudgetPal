import { useState } from "react";
import { formatDate, getTodayLocal } from "../../utils/format";

const Expenses = ({ expenses, income, deleteExpense, deleteIncome, updateExpense, updateIncome }) => {
    // State for tracking which expense/income is being edited and the form data for editing
    const [editingExpenseId, setEditingExpenseId] = useState(null);
    const [editingIncomeId, setEditingIncomeId] = useState(null);
    const [editExpenseForm, setEditExpenseForm] = useState({ description: "", amount: "", category: "", date: "" });
    const [editIncomeForm, setEditIncomeForm] = useState({ source: "", amount: "", date: "" });

    const toInputDate = (val) => (val ? String(val).slice(0, 10) : "");

    // Handlers to edit the expense data
    const startEditExpense = (expense) => {
        setEditingExpenseId(expense.id);
        setEditExpenseForm({ description: expense.description, amount: expense.amount, category: expense.category, date: toInputDate(expense.date) });
    };

    // Handlers to edit the income data
    const startEditIncome = (inc) => {
        setEditingIncomeId(inc.id);
        setEditIncomeForm({ source: inc.source, amount: inc.amount, date: toInputDate(inc.date) });
    };

    // Saving the new updated expense data
    const saveExpense = () => {
        updateExpense(editingExpenseId, editExpenseForm);
        setEditingExpenseId(null);
    };

    // Saving the new updated income data
    const saveIncome = () => {
        updateIncome(editingIncomeId, editIncomeForm);
        setEditingIncomeId(null);
    };

    // Cancel editing for income and expense
    const cancelEdit = () => {
        setEditingExpenseId(null);
        setEditingIncomeId(null);
    };

    return (
        <div style={{ background: "var(--bg-base)", minHeight: "calc(100vh - 60px)", padding: "0.5rem 0 2rem" }}>
        <div className="expense-display-card">
            <h2>Expenses</h2>
            <table>
                <thead>
                    <tr>
                        <th>Description</th>
                        <th>Amount</th>
                        <th>Category</th>
                        <th>Date</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {expenses.length === 0 ? (
                        <tr>
                            <td colSpan="5" style={{ textAlign: 'center', padding: '20px' }}>
                                No expenses added yet
                            </td>
                        </tr>
                    ) : (
                        expenses.map((expense) => (
                            <tr key={expense.id}>
                                {editingExpenseId === expense.id ? (
                                    <>
                                        <td><input type="text" className="table-input" value={editExpenseForm.description} onChange={(e) => setEditExpenseForm({ ...editExpenseForm, description: e.target.value })} /></td>
                                        <td><input type="text" className="table-input" value={editExpenseForm.amount} onChange={(e) => setEditExpenseForm({ ...editExpenseForm, amount: e.target.value })} /></td>
                                        <td><input type="text" className="table-input" value={editExpenseForm.category} onChange={(e) => setEditExpenseForm({ ...editExpenseForm, category: e.target.value })} /></td>
                                        <td><input type="date" className="table-input" value={editExpenseForm.date} max={getTodayLocal()} onChange={(e) => setEditExpenseForm({ ...editExpenseForm, date: e.target.value })} /></td>
                                        <td>
                                            <button type="button" className="save-btn" onClick={saveExpense}>Save</button>
                                            <button type="button" className="cancel-btn" onClick={cancelEdit}>Cancel</button>
                                        </td>
                                    </>
                                ) : (
                                    <>
                                        <td>{expense.description}</td>
                                        <td>${expense.amount}</td>
                                        <td>{expense.category}</td>
                                        <td>{formatDate(expense.date)}</td>
                                        <td>
                                            <button type="button" className="update-btn" onClick={() => startEditExpense(expense)}>Update</button>
                                            <button type="button" className="delete-btn" onClick={() => deleteExpense(expense.id)}>Delete</button>
                                        </td>
                                    </>
                                )}
                            </tr>
                        ))
                    )}
                </tbody>
            </table>

            <h2 style={{ marginTop: '2.5rem' }}>Income</h2>
            <table>
                <thead>
                    <tr>
                        <th>Source</th>
                        <th>Amount</th>
                        <th>Date</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {income.length === 0 ? (
                        <tr>
                            <td colSpan="4" style={{ textAlign: 'center', padding: '20px' }}>
                                No income added yet
                            </td>
                        </tr>
                    ) : (
                        income.map((inc) => (
                            <tr key={inc.id}>
                                {editingIncomeId === inc.id ? (
                                    <>
                                        <td><input type="text" className="table-input" value={editIncomeForm.source} onChange={(e) => setEditIncomeForm({ ...editIncomeForm, source: e.target.value })} /></td>
                                        <td><input type="text" className="table-input" value={editIncomeForm.amount} onChange={(e) => setEditIncomeForm({ ...editIncomeForm, amount: e.target.value })} /></td>
                                        <td><input type="date" className="table-input" value={editIncomeForm.date} max={getTodayLocal()} onChange={(e) => setEditIncomeForm({ ...editIncomeForm, date: e.target.value })} /></td>
                                        <td>
                                            <button type="button" className="save-btn" onClick={saveIncome}>Save</button>
                                            <button type="button" className="cancel-btn" onClick={cancelEdit}>Cancel</button>
                                        </td>
                                    </>
                                ) : (
                                    <>
                                        <td>{inc.source}</td>
                                        <td>${inc.amount}</td>
                                        <td>{formatDate(inc.date)}</td>
                                        <td>
                                            <button type="button" className="update-btn" onClick={() => startEditIncome(inc)}>Update</button>
                                            <button type="button" className="delete-btn" onClick={() => deleteIncome(inc.id)}>Delete</button>
                                        </td>
                                    </>
                                )}
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
        </div>
    );
}

export default Expenses;