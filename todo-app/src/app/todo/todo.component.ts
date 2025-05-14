import {
  Component,
  type OnInit,
  ViewChildren,
  type QueryList,
  type ElementRef,
  type AfterViewInit,
} from "@angular/core"
import { CommonModule } from "@angular/common"
import { FormsModule } from "@angular/forms"
import { MatInputModule } from "@angular/material/input"
import { MatButtonModule } from "@angular/material/button"
import { MatCheckboxModule } from "@angular/material/checkbox"
import { MatCardModule } from "@angular/material/card"
import { TodoService } from "../todo.service"
import type { Todo } from "../todo.model"

interface ExtendedTodo extends Todo {
  editing?: boolean
  editTitle?: string
}

@Component({
  selector: "app-todo",
  standalone: true,
  imports: [CommonModule, FormsModule, MatInputModule, MatButtonModule, MatCheckboxModule, MatCardModule],
  templateUrl: "./todo.component.html",
  styleUrls: ["./todo.component.css"],
})
export class TodoComponent implements OnInit, AfterViewInit {
  todos: ExtendedTodo[] = []
  filteredTodos: ExtendedTodo[] = []
  newTodoTitle = ""
  searchTerm = ""

  @ViewChildren("editInput") editInputs!: QueryList<ElementRef>

  constructor(private todoService: TodoService) {}

  ngOnInit(): void {
    this.todoService.getTodos().subscribe((data) => {
      this.todos = data.slice(0, 10).map((todo) => ({
        ...todo,
        editing: false,
        editTitle: todo.title,
      }))
      this.filteredTodos = [...this.todos]
    })
  }

  ngAfterViewInit() {
    this.editInputs.changes.subscribe(() => {
      if (this.editInputs.length > 0) {
        this.editInputs.first.nativeElement.focus()
      }
    })
  }

  addTodo() {
    if (!this.newTodoTitle.trim()) return

    const todo: Partial<ExtendedTodo> = {
      userId: 1,
      title: this.newTodoTitle,
      completed: false,
      editing: false,
      editTitle: this.newTodoTitle,
    }

    this.todoService.addTodo(todo).subscribe((created) => {
      const extendedTodo: ExtendedTodo = {
        ...created,
        editing: false,
        editTitle: created.title,
      }
      this.todos.unshift(extendedTodo)
      this.filterTasks()
      this.newTodoTitle = ""
    })
  }

  updateTodo(todo: ExtendedTodo) {
    this.todoService.updateTodo(todo.id, todo).subscribe()
  }

  deleteTodo(id: number) {
    this.todoService.deleteTodo(id).subscribe(() => {
      this.todos = this.todos.filter((t) => t.id !== id)
      this.filterTasks()
    })
  }

  startEdit(todo: ExtendedTodo) {
    // First reset any other editing todos
    this.todos.forEach((t) => {
      if (t.id !== todo.id) {
        t.editing = false
      }
    })

    todo.editing = true
    todo.editTitle = todo.title
  }

  saveEdit(todo: ExtendedTodo) {
    if (!todo.editTitle?.trim()) {
      todo.editing = false
      todo.editTitle = todo.title
      return
    }

    todo.title = todo.editTitle
    todo.editing = false
    this.updateTodo(todo)
  }

  filterTasks() {
    if (!this.searchTerm.trim()) {
      this.filteredTodos = [...this.todos]
      return
    }

    const searchTermLower = this.searchTerm.toLowerCase()
    this.filteredTodos = this.todos.filter((todo) => todo.title.toLowerCase().includes(searchTermLower))
  }
}
