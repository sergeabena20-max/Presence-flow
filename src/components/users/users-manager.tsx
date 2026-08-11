<div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Utilisateurs</h1>
        <div className="flex items-center gap-2">
          {canAssignAdmin && (
            
              href="/users/permissions"
              className="rounded-md border border-slate-300 dark:border-slate-700 px-4 py-2 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              Gérer les permissions
            </a>
          )}
          <button
            onClick={openCreate}
            className="rounded-md bg-slate-900 dark:bg-slate-100 px-4 py-2 text-sm font-medium text-white dark:text-slate-900 hover:opacity-90"
          >
            + Nouvel utilisateur
          </button>
        </div>
      </div>
